/* eslint-disable no-unused-vars */
const enc = require('crypto-js');
const aes = require('aes-js');
const fs = require('fs');
const gfs = require('graceful-fs');
const xml2js = require('xml2js');
const path = require('path');
const request = require('request');
const jQuery = require('jquery');
const { shell, ipcRenderer } = require('electron');
const remote = require('@electron/remote');

const dock = remote.getGlobal('ods-dock');
const $ = jQuery;