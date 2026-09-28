'use strict';

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
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

        const idleTimeRow = new Adw.SpinRow({
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
        
        const idleAppRow = new Adw.EntryRow({
            title: 'Application To Run',
            input_purpose: 'The app to run when the idle time is reached',
            text: settings.get_string(SettingsKey.IDLE_APP)
        })

        const idleAppArgsRow = new Adw.EntryRow({
            title: 'Application Arguments',
            input_purpose: 'The arguments to supply to the selected app',
            text: settings.get_string(SettingsKey.IDLE_APP_ARGS)
        })
        
        behaviorGroup.add(idleTimeRow)
        actionGroup.add(idleAppRow)
        actionGroup.add(idleAppArgsRow)

        page.add(behaviorGroup);
        page.add(actionGroup);

        window.add(page);

        settings.bind(SettingsKey.IDLE_APP, idleAppRow, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind(SettingsKey.IDLE_APP_ARGS, idleAppArgsRow, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind(SettingsKey.IDLE_SECONDS, idleTimeRow, 'value', Gio.SettingsBindFlags.DEFAULT);
    }
}