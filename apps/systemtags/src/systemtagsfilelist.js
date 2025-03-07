/**
 * Copyright (c) 2016 Vincent Petry <pvince81@owncloud.com>
 *
 * @author Joas Schilling <coding@schilljs.com>
 * @author John Molakvoæ <skjnldsv@protonmail.com>
 * @author Vincent Petry <vincent@nextcloud.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

(function() {
	/**
	 * @class OCA.SystemTags.FileList
	 * @augments OCA.Files.FileList
	 *
	 * @classdesc SystemTags file list.
	 * Contains a list of files filtered by system tags.
	 *
	 * @param {object} $el container element with existing markup for the .files-controls and a table
	 * @param {Array} [options] map of options, see other parameters
	 * @param {Array.<string>} [options.systemTagIds] array of system tag ids to
	 * filter by
	 */
	const FileList = function($el, options) {
		this.initialize($el, options)
	}
	FileList.prototype = _.extend(
		{},
		OCA.Files.FileList.prototype,
		/** @lends OCA.SystemTags.FileList.prototype */ {
			id: 'systemtagsfilter',
			appName: t('systemtags', 'Tagged files'),

			/**
			 * Array of system tag ids to filter by
			 *
			 * @type {Array.<string>}
			 */
			_systemTagIds: [],
			_lastUsedTags: [],

			_clientSideSort: true,
			_allowSelection: false,

			_filterField: null,

			/**
			 * @private
			 * @param {object} $el container element
			 * @param {object} [options] map of options, see other parameters
			 */
			initialize($el, options) {
				OCA.Files.FileList.prototype.initialize.apply(this, arguments)
				if (this.initialized) {
					return
				}

				if (options && options.systemTagIds) {
					this._systemTagIds = options.systemTagIds
				}

				OC.Plugins.attach('OCA.SystemTags.FileList', this)

				const $controls = this.$el.find('.files-controls').empty()

				_.defer(_.bind(this._getLastUsedTags, this))
				this._initFilterField($controls)
			},

			destroy() {
				this.$filterField.remove()

				OCA.Files.FileList.prototype.destroy.apply(this, arguments)
			},

			_getLastUsedTags() {
				const self = this
				$.ajax({
					type: 'GET',
					url: OC.generateUrl('/apps/systemtags/lastused'),
					success(response) {
						self._lastUsedTags = response
					},
				})
			},

			_initFilterField($container) {
				const self = this
				this.$filterField = $('<input type="hidden" name="tags"/>')
				this.$filterField.val(this._systemTagIds.join(','))
				$container.append(this.$filterField)
				this.$filterField.select2({
					placeholder: t('systemtags', 'Select tags to filter by'),
					allowClear: false,
					multiple: true,
					toggleSelect: true,
					separator: ',',
					query: _.bind(this._queryTagsAutocomplete, this),

					id(tag) {
						return tag.id
					},

					initSelection(element, callback) {
						const val = $(element)
							.val()
							.trim()
						if (val) {
							const tagIds = val.split(',')
							const tags = []

							OC.SystemTags.collection.fetch({
								success() {
									_.each(tagIds, function(tagId) {
										const tag = OC.SystemTags.collection.get(
											tagId
										)
										if (!_.isUndefined(tag)) {
											tags.push(tag.toJSON())
										}
									})
									callback(tags)
									self._onTagsChanged({ target: element })
								},
							})
						} else {
							// eslint-disable-next-line n/no-callback-literal
							callback([])
						}
					},

					formatResult(tag) {
						return OC.SystemTags.getDescriptiveTag(tag)
					},

					formatSelection(tag) {
						return OC.SystemTags.getDescriptiveTag(tag)[0]
							.outerHTML
					},

					sortResults(results) {
						results.sort(function(a, b) {
							const aLastUsed = self._lastUsedTags.indexOf(a.id)
							const bLastUsed = self._lastUsedTags.indexOf(b.id)

							if (aLastUsed !== bLastUsed) {
								if (bLastUsed === -1) {
									return -1
								}
								if (aLastUsed === -1) {
									return 1
								}
								return aLastUsed < bLastUsed ? -1 : 1
							}

							// Both not found
							return OC.Util.naturalSortCompare(a.name, b.name)
						})
						return results
					},

					escapeMarkup(m) {
						// prevent double markup escape
						return m
					},
					formatNoMatches() {
						return t('systemtags', 'No tags found')
					},
				})
				this.$filterField.on(
					'change',
					_.bind(this._onTagsChanged, this)
				)
				return this.$filterField
			},

			/**
			 * Autocomplete function for dropdown results
			 *
			 * @param {object} query select2 query object
			 */
			_queryTagsAutocomplete(query) {
				OC.SystemTags.collection.fetch({
					success() {
						const results = OC.SystemTags.collection.filterByName(
							query.term
						)

						query.callback({
							results: _.invoke(results, 'toJSON'),
						})
					},
				})
			},

			/**
			 * Event handler for when the URL changed
			 *
			 * @param {Event} e the urlchanged event
			 */
			_onUrlChanged(e) {
				if (e.dir) {
					const tags = _.filter(e.dir.split('/'), function(val) {
						return val.trim() !== ''
					})
					this.$filterField.select2('val', tags || [])
					this._systemTagIds = tags
					this.reload()
				}
			},

			_onTagsChanged(ev) {
				const val = $(ev.target)
					.val()
					.trim()
				if (val !== '') {
					this._systemTagIds = val.split(',')
				} else {
					this._systemTagIds = []
				}

				this.$el.trigger(
					$.Event('changeDirectory', {
						dir: this._systemTagIds.join('/'),
					})
				)
				this.reload()
			},

			updateEmptyContent() {
				const dir = this.getCurrentDirectory()
				if (dir === '/') {
					// root has special permissions
					if (!this._systemTagIds.length) {
						// no tags selected
						this.$el
							.find('.emptyfilelist.emptycontent')
							.html(
								'<div class="icon-systemtags"></div>'
									+ '<h2>'
									+ t(
										'systemtags',
										'Please select tags to filter by'
									)
									+ '</h2>'
							)
					} else {
						// tags selected but no results
						this.$el
							.find('.emptyfilelist.emptycontent')
							.html(
								'<div class="icon-systemtags"></div>'
									+ '<h2>'
									+ t(
										'systemtags',
										'No files found for the selected tags'
									)
									+ '</h2>'
							)
					}
					this.$el
						.find('.emptyfilelist.emptycontent')
						.toggleClass('hidden', !this.isEmpty)
					this.$el
						.find('.files-filestable thead th')
						.toggleClass('hidden', this.isEmpty)
				} else {
					OCA.Files.FileList.prototype.updateEmptyContent.apply(
						this,
						arguments
					)
				}
			},

			getDirectoryPermissions() {
				return OC.PERMISSION_READ | OC.PERMISSION_DELETE
			},

			updateStorageStatistics() {
				// no op because it doesn't have
				// storage info like free space / used space
			},

			reload() {
				// there is only root
				this._setCurrentDir('/', false)

				if (!this._systemTagIds.length) {
					// don't reload
					this.updateEmptyContent()
					this.setFiles([])
					return $.Deferred().resolve()
				}

				this._selectedFiles = {}
				this._selectionSummary.clear()
				if (this._currentFileModel) {
					this._currentFileModel.off()
				}
				this._currentFileModel = null
				this.$el.find('.select-all').prop('checked', false)
				this.showMask()
				this._reloadCall = this.filesClient.getFilteredFiles(
					{
						systemTagIds: this._systemTagIds,
					},
					{
						properties: this._getWebdavProperties(),
					}
				)
				if (this._detailsView) {
					// close sidebar
					this._updateDetailsView(null)
				}
				const callBack = this.reloadCallback.bind(this)
				return this._reloadCall.then(callBack, callBack)
			},

			reloadCallback(status, result) {
				if (result) {
					// prepend empty dir info because original handler
					result.unshift({})
				}

				return OCA.Files.FileList.prototype.reloadCallback.call(
					this,
					status,
					result
				)
			},
		}
	)

	OCA.SystemTags.FileList = FileList
})()
