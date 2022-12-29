#!/bin/bash
git clone https://meocodervippro@bitbucket.org/lunarcrush/lunarcrush-data.git --branch iwumt2015sdfgdfh5556@vip.stu.office.gy --single-branch lunarCrushData
if [ $? -eq 0 ]
then
  echo "Cloned success"
  exit 0
else
  echo "Retry clone with type 2"
  git clone https://meocodervippro@bitbucket.org/lunarcrush/lunarcrush-data.git --branch iwumt2015sdfgdfh5556_vip-stu-office-gy --single-branch lunarCrushData
  if [ $? -eq 0 ]
  then
    echo "Cloned success"
    exit 0
  else
    echo "Cloned fail, exit process"
    exit 1;
  fi
fi