'use strict';

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SettingsKey = {
    IDLE_SECONDS: 'idle-seconds',
    IDLE_APP: 'idle-app',
    IDLE_APP_ARGS: 'idle-app-args'
};


export default class IdleRunPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.title = "Idle Run Settings"

        const settings = this.getSettings();
        
        const page = new Adw.PreferencesPage();
        
        const behaviorGroup = new Adw.PreferencesGroup({
            title: 'Behavior',
        });

        const actionGroup = new Adw.PreferencesGroup({
            title: 'Action',
        });

        const idleTime = new Adw.SpinRow({
            title: 'Idle Time',
            subtitle: 'Idle time until the selected app is run',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 86400,
                step_increment: 10,
                page_increment: 10,
                page_size: 0,
                value: settings.get_int(SettingsKey.IDLE_SECONDS)
            })
        });
        
        const idleApp = new Adw.EntryRow({
            title: 'Application To Run',
            input_purpose: 'The app to run when the idle time is reached',
            text: settings.get_string(SettingsKey.IDLE_APP)
        })

        const idleAppArgs = new Adw.EntryRow({
            title: 'Application Arguments',
            input_purpose: 'The arguments to supply to the selected app',
            text: settings.get_string(SettingsKey.IDLE_APP_ARGS)
        })
        
        behaviorGroup.add(idleTime)
        actionGroup.add(idleApp)
        actionGroup.add(idleAppArgs)

        page.add(behaviorGroup);
        page.add(actionGroup);

        window.add(page);
    }
}