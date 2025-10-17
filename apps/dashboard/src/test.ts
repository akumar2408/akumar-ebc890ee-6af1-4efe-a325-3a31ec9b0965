// Angular CLI testing entry point.
// Make sure this runs BEFORE any spec files.

import 'zone.js';                 // required by Angular
import 'zone.js/testing';         // installs jasmine patch + ProxyZone
import 'zone.js/plugins/jasmine-patch'; // extra guard for ProxyZone

import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    // keeps the component tree around between tests; avoids edge cases
    teardown: { destroyAfterEach: false },
  }
);
