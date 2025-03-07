<?php
/**
 * @copyright Copyright (c) 2016, ownCloud, Inc.
 *
 * @author Dariusz Olszewski <starypatyk@users.noreply.github.com>
 * @author Joas Schilling <coding@schilljs.com>
 * @author Julius Härtl <jus@bitgrid.net>
 * @author Lukas Reschke <lukas@statuscode.ch>
 * @author Morris Jobke <hey@morrisjobke.de>
 * @author Robin Appelman <robin@icewind.nl>
 * @author Roeland Jago Douma <roeland@famdouma.nl>
 * @author Vincent Petry <vincent@nextcloud.com>
 *
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program. If not, see <http://www.gnu.org/licenses/>
 *
 */
namespace OC\Files\Config;

use OCP\Cache\CappedMemoryCache;
use OCA\Files_Sharing\SharedMount;
use OCP\DB\QueryBuilder\IQueryBuilder;
use OCP\Files\Config\ICachedMountFileInfo;
use OCP\Files\Config\ICachedMountInfo;
use OCP\Files\Config\IUserMountCache;
use OCP\Files\Mount\IMountPoint;
use OCP\Files\NotFoundException;
use OCP\IDBConnection;
use OCP\IUser;
use OCP\IUserManager;
use Psr\Log\LoggerInterface;

/**
 * Cache mounts points per user in the cache so we can easily look them up
 */
class UserMountCache implements IUserMountCache {
	private IDBConnection $connection;
	private IUserManager $userManager;

	/**
	 * Cached mount info.
	 * @var CappedMemoryCache<ICachedMountInfo[]>
	 **/
	private CappedMemoryCache $mountsForUsers;
	private LoggerInterface $logger;
	/** @var CappedMemoryCache<array> */
	private CappedMemoryCache $cacheInfoCache;

	/**
	 * UserMountCache constructor.
	 */
	public function __construct(IDBConnection $connection, IUserManager $userManager, LoggerInterface $logger) {
		$this->connection = $connection;
		$this->userManager = $userManager;
		$this->logger = $logger;
		$this->cacheInfoCache = new CappedMemoryCache();
		$this->mountsForUsers = new CappedMemoryCache();
	}

	public function registerMounts(IUser $user, array $mounts, array $mountProviderClasses = null) {
		// filter out non-proper storages coming from unit tests
		$mounts = array_filter($mounts, function (IMountPoint $mount) {
			return $mount instanceof SharedMount || ($mount->getStorage() && $mount->getStorage()->getCache());
		});
		/** @var ICachedMountInfo[] $newMounts */
		$newMounts = array_map(function (IMountPoint $mount) use ($user) {
			// filter out any storages which aren't scanned yet since we aren't interested in files from those storages (yet)
			if ($mount->getStorageRootId() === -1) {
				return null;
			} else {
				return new LazyStorageMountInfo($user, $mount);
			}
		}, $mounts);
		$newMounts = array_values(array_filter($newMounts));
		$newMountRootIds = array_map(function (ICachedMountInfo $mount) {
			return $mount->getRootId();
		}, $newMounts);
		$newMounts = array_combine($newMountRootIds, $newMounts);

		$cachedMounts = $this->getMountsForUser($user);
		if (is_array($mountProviderClasses)) {
			$cachedMounts = array_filter($cachedMounts, function (ICachedMountInfo $mountInfo) use ($mountProviderClasses) {
				return in_array($mountInfo->getMountProvider(), $mountProviderClasses);
			});
		}
		$cachedMountRootIds = array_map(function (ICachedMountInfo $mount) {
			return $mount->getRootId();
		}, $cachedMounts);
		$cachedMounts = array_combine($cachedMountRootIds, $cachedMounts);

		$addedMounts = [];
		$removedMounts = [];

		foreach ($newMounts as $rootId => $newMount) {
			if (!isset($cachedMounts[$rootId])) {
				$addedMounts[] = $newMount;
			}
		}

		foreach ($cachedMounts as $rootId => $cachedMount) {
			if (!isset($newMounts[$rootId])) {
				$removedMounts[] = $cachedMount;
			}
		}

		$changedMounts = $this->findChangedMounts($newMounts, $cachedMounts);

		foreach ($addedMounts as $mount) {
			$this->addToCache($mount);
			/** @psalm-suppress InvalidArgument */
			$this->mountsForUsers[$user->getUID()][] = $mount;
		}
		foreach ($removedMounts as $mount) {
			$this->removeFromCache($mount);
			$index = array_search($mount, $this->mountsForUsers[$user->getUID()]);
			unset($this->mountsForUsers[$user->getUID()][$index]);
		}
		foreach ($changedMounts as $mount) {
			$this->updateCachedMount($mount);
		}
	}

	/**
	 * @param ICachedMountInfo[] $newMounts
	 * @param ICachedMountInfo[] $cachedMounts
	 * @return ICachedMountInfo[]
	 */
	private function findChangedMounts(array $newMounts, array $cachedMounts) {
		$new = [];
		foreach ($newMounts as $mount) {
			$new[$mount->getRootId()] = $mount;
		}
		$changed = [];
		foreach ($cachedMounts as $cachedMount) {
			$rootId = $cachedMount->getRootId();
			if (isset($new[$rootId])) {
				$newMount = $new[$rootId];
				if (
					$newMount->getMountPoint() !== $cachedMount->getMountPoint() ||
					$newMount->getStorageId() !== $cachedMount->getStorageId() ||
					$newMount->getMountId() !== $cachedMount->getMountId() ||
					$newMount->getMountProvider() !== $cachedMount->getMountProvider()
				) {
					$changed[] = $newMount;
				}
			}
		}
		return $changed;
	}

	private function addToCache(ICachedMountInfo $mount) {
		if ($mount->getStorageId() !== -1) {
			$this->connection->insertIfNotExist('*PREFIX*mounts', [
				'storage_id' => $mount->getStorageId(),
				'root_id' => $mount->getRootId(),
				'user_id' => $mount->getUser()->getUID(),
				'mount_point' => $mount->getMountPoint(),
				'mount_id' => $mount->getMountId(),
				'mount_provider_class' => $mount->getMountProvider(),
			], ['root_id', 'user_id']);
		} else {
			// in some cases this is legitimate, like orphaned shares
			$this->logger->debug('Could not get storage info for mount at ' . $mount->getMountPoint());
		}
	}

	private function updateCachedMount(ICachedMountInfo $mount) {
		$builder = $this->connection->getQueryBuilder();

		$query = $builder->update('mounts')
			->set('storage_id', $builder->createNamedParameter($mount->getStorageId()))
			->set('mount_point', $builder->createNamedParameter($mount->getMountPoint()))
			->set('mount_id', $builder->createNamedParameter($mount->getMountId(), IQueryBuilder::PARAM_INT))
			->set('mount_provider_class', $builder->createNamedParameter($mount->getMountProvider()))
			->where($builder->expr()->eq('user_id', $builder->createNamedParameter($mount->getUser()->getUID())))
			->andWhere($builder->expr()->eq('root_id', $builder->createNamedParameter($mount->getRootId(), IQueryBuilder::PARAM_INT)));

		$query->execute();
	}

	private function removeFromCache(ICachedMountInfo $mount) {
		$builder = $this->connection->getQueryBuilder();

		$query = $builder->delete('mounts')
			->where($builder->expr()->eq('user_id', $builder->createNamedParameter($mount->getUser()->getUID())))
			->andWhere($builder->expr()->eq('root_id', $builder->createNamedParameter($mount->getRootId(), IQueryBuilder::PARAM_INT)));
		$query->execute();
	}

	private function dbRowToMountInfo(array $row) {
		$user = $this->userManager->get($row['user_id']);
		if (is_null($user)) {
			return null;
		}
		$mount_id = $row['mount_id'];
		if (!is_null($mount_id)) {
			$mount_id = (int)$mount_id;
		}
		return new CachedMountInfo(
			$user,
			(int)$row['storage_id'],
			(int)$row['root_id'],
			$row['mount_point'],
			$row['mount_provider_class'] ?? '',
			$mount_id,
			isset($row['path']) ? $row['path'] : '',
		);
	}

	/**
	 * @param IUser $user
	 * @return ICachedMountInfo[]
	 */
	public function getMountsForUser(IUser $user) {
		if (!isset($this->mountsForUsers[$user->getUID()])) {
			$builder = $this->connection->getQueryBuilder();
			$query = $builder->select('storage_id', 'root_id', 'user_id', 'mount_point', 'mount_id', 'f.path', 'mount_provider_class')
				->from('mounts', 'm')
				->innerJoin('m', 'filecache', 'f', $builder->expr()->eq('m.root_id', 'f.fileid'))
				->where($builder->expr()->eq('user_id', $builder->createPositionalParameter($user->getUID())));

			$result = $query->execute();
			$rows = $result->fetchAll();
			$result->closeCursor();

			$this->mountsForUsers[$user->getUID()] = array_filter(array_map([$this, 'dbRowToMountInfo'], $rows));
		}
		return $this->mountsForUsers[$user->getUID()];
	}

	/**
	 * @param int $numericStorageId
	 * @param string|null $user limit the results to a single user
	 * @return CachedMountInfo[]
	 */
	public function getMountsForStorageId($numericStorageId, $user = null) {
		$builder = $this->connection->getQueryBuilder();
		$query = $builder->select('storage_id', 'root_id', 'user_id', 'mount_point', 'mount_id', 'f.path', 'mount_provider_class')
			->from('mounts', 'm')
			->innerJoin('m', 'filecache', 'f', $builder->expr()->eq('m.root_id', 'f.fileid'))
			->where($builder->expr()->eq('storage_id', $builder->createPositionalParameter($numericStorageId, IQueryBuilder::PARAM_INT)));

		if ($user) {
			$query->andWhere($builder->expr()->eq('user_id', $builder->createPositionalParameter($user)));
		}

		$result = $query->execute();
		$rows = $result->fetchAll();
		$result->closeCursor();

		return array_filter(array_map([$this, 'dbRowToMountInfo'], $rows));
	}

	/**
	 * @param int $rootFileId
	 * @return CachedMountInfo[]
	 */
	public function getMountsForRootId($rootFileId) {
		$builder = $this->connection->getQueryBuilder();
		$query = $builder->select('storage_id', 'root_id', 'user_id', 'mount_point', 'mount_id', 'f.path', 'mount_provider_class')
			->from('mounts', 'm')
			->innerJoin('m', 'filecache', 'f', $builder->expr()->eq('m.root_id', 'f.fileid'))
			->where($builder->expr()->eq('root_id', $builder->createPositionalParameter($rootFileId, IQueryBuilder::PARAM_INT)));

		$result = $query->execute();
		$rows = $result->fetchAll();
		$result->closeCursor();

		return array_filter(array_map([$this, 'dbRowToMountInfo'], $rows));
	}

	/**
	 * @param $fileId
	 * @return array{int, string, int}
	 * @throws \OCP\Files\NotFoundException
	 */
	private function getCacheInfoFromFileId($fileId): array {
		if (!isset($this->cacheInfoCache[$fileId])) {
			$builder = $this->connection->getQueryBuilder();
			$query = $builder->select('storage', 'path', 'mimetype')
				->from('filecache')
				->where($builder->expr()->eq('fileid', $builder->createNamedParameter($fileId, IQueryBuilder::PARAM_INT)));

			$result = $query->execute();
			$row = $result->fetch();
			$result->closeCursor();

			if (is_array($row)) {
				$this->cacheInfoCache[$fileId] = [
					(int)$row['storage'],
					(string)$row['path'],
					(int)$row['mimetype']
				];
			} else {
				throw new NotFoundException('File with id "' . $fileId . '" not found');
			}
		}
		return $this->cacheInfoCache[$fileId];
	}

	/**
	 * @param int $fileId
	 * @param string|null $user optionally restrict the results to a single user
	 * @return ICachedMountFileInfo[]
	 * @since 9.0.0
	 */
	public function getMountsForFileId($fileId, $user = null) {
		try {
			[$storageId, $internalPath] = $this->getCacheInfoFromFileId($fileId);
		} catch (NotFoundException $e) {
			return [];
		}
		$builder = $this->connection->getQueryBuilder();
		$query = $builder->select('storage_id', 'root_id', 'user_id', 'mount_point', 'mount_id', 'f.path', 'mount_provider_class')
			->from('mounts', 'm')
			->innerJoin('m', 'filecache', 'f', $builder->expr()->eq('m.root_id', 'f.fileid'))
			->where($builder->expr()->eq('storage_id', $builder->createPositionalParameter($storageId, IQueryBuilder::PARAM_INT)));

		if ($user) {
			$query->andWhere($builder->expr()->eq('user_id', $builder->createPositionalParameter($user)));
		}

		$result = $query->execute();
		$rows = $result->fetchAll();
		$result->closeCursor();
		// filter mounts that are from the same storage but a different directory
		$filteredMounts = array_filter($rows, function (array $row) use ($internalPath, $fileId) {
			if ($fileId === (int)$row['root_id']) {
				return true;
			}
			$internalMountPath = $row['path'] ?? '';

			return $internalMountPath === '' || substr($internalPath, 0, strlen($internalMountPath) + 1) === $internalMountPath . '/';
		});

		$filteredMounts = array_filter(array_map([$this, 'dbRowToMountInfo'], $filteredMounts));
		return array_map(function (ICachedMountInfo $mount) use ($internalPath) {
			return new CachedMountFileInfo(
				$mount->getUser(),
				$mount->getStorageId(),
				$mount->getRootId(),
				$mount->getMountPoint(),
				$mount->getMountId(),
				$mount->getMountProvider(),
				$mount->getRootInternalPath(),
				$internalPath
			);
		}, $filteredMounts);
	}

	/**
	 * Remove all cached mounts for a user
	 *
	 * @param IUser $user
	 */
	public function removeUserMounts(IUser $user) {
		$builder = $this->connection->getQueryBuilder();

		$query = $builder->delete('mounts')
			->where($builder->expr()->eq('user_id', $builder->createNamedParameter($user->getUID())));
		$query->execute();
	}

	public function removeUserStorageMount($storageId, $userId) {
		$builder = $this->connection->getQueryBuilder();

		$query = $builder->delete('mounts')
			->where($builder->expr()->eq('user_id', $builder->createNamedParameter($userId)))
			->andWhere($builder->expr()->eq('storage_id', $builder->createNamedParameter($storageId, IQueryBuilder::PARAM_INT)));
		$query->execute();
	}

	public function remoteStorageMounts($storageId) {
		$builder = $this->connection->getQueryBuilder();

		$query = $builder->delete('mounts')
			->where($builder->expr()->eq('storage_id', $builder->createNamedParameter($storageId, IQueryBuilder::PARAM_INT)));
		$query->execute();
	}

	/**
	 * @param array $users
	 * @return array
	 */
	public function getUsedSpaceForUsers(array $users) {
		$builder = $this->connection->getQueryBuilder();

		$slash = $builder->createNamedParameter('/');

		$mountPoint = $builder->func()->concat(
			$builder->func()->concat($slash, 'user_id'),
			$slash
		);

		$userIds = array_map(function (IUser $user) {
			return $user->getUID();
		}, $users);

		$query = $builder->select('m.user_id', 'f.size')
			->from('mounts', 'm')
			->innerJoin('m', 'filecache', 'f',
				$builder->expr()->andX(
					$builder->expr()->eq('m.storage_id', 'f.storage'),
					$builder->expr()->eq('f.path_hash', $builder->createNamedParameter(md5('files')))
				))
			->where($builder->expr()->eq('m.mount_point', $mountPoint))
			->andWhere($builder->expr()->in('m.user_id', $builder->createNamedParameter($userIds, IQueryBuilder::PARAM_STR_ARRAY)));

		$result = $query->execute();

		$results = [];
		while ($row = $result->fetch()) {
			$results[$row['user_id']] = $row['size'];
		}
		$result->closeCursor();
		return $results;
	}

	public function clear(): void {
		$this->cacheInfoCache = new CappedMemoryCache();
		$this->mountsForUsers = new CappedMemoryCache();
	}

	public function getMountForPath(IUser $user, string $path): ICachedMountInfo {
		$mounts = $this->getMountsForUser($user);
		$mountPoints = array_map(function (ICachedMountInfo $mount) {
			return $mount->getMountPoint();
		}, $mounts);
		$mounts = array_combine($mountPoints, $mounts);

		$current = $path;
		// walk up the directory tree until we find a path that has a mountpoint set
		// the loop will return if a mountpoint is found or break if none are found
		while (true) {
			$mountPoint = $current . '/';
			if (isset($mounts[$mountPoint])) {
				return $mounts[$mountPoint];
			} elseif ($current === '') {
				break;
			}

			$current = dirname($current);
			if ($current === '.' || $current === '/') {
				$current = '';
			}
		}

		throw new NotFoundException("No cached mount for path " . $path);
	}

	public function getMountsInPath(IUser $user, string $path): array {
		$path = rtrim($path, '/') . '/';
		$mounts = $this->getMountsForUser($user);
		return array_filter($mounts, function (ICachedMountInfo $mount) use ($path) {
			return $mount->getMountPoint() !== $path && strpos($mount->getMountPoint(), $path) === 0;
		});
	}
}
