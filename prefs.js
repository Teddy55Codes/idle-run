'use strict';

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

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
            subtitle: 'Idle time until the selected app is run in seconds',
            adjustment: new Gtk.Adjustment({
                lower: 5,
                upper: 86400,
                step_increment: 10,
                page_increment: 10,
                page_size: 0,
                value: settings.get_int('idle-seconds')
            })
        });

        const inhibitAutoSuspendRow = new Adw.SwitchRow({
            title: 'Disable Auto Suspend',
            subtitle: 'Whether or not to block auto suspend (doesn\'t disable screen blank)',
            active: settings.get_boolean('inhibit-auto-suspend')
        })
        
        const idleAppRow = new Adw.EntryRow({
            title: 'Application To Run',
            input_purpose: 'The app to run when the idle time is reached',
            text: settings.get_string('idle-app')
        })

        const idleAppArgsRow = new Adw.EntryRow({
            title: 'Application Arguments',
            input_purpose: 'The arguments to supply to the selected app',
            text: settings.get_string('idle-app-args')
        })
        
        behaviorGroup.add(idleTimeRow)
        behaviorGroup.add(inhibitAutoSuspendRow)
        actionGroup.add(idleAppRow)
        actionGroup.add(idleAppArgsRow)

        page.add(behaviorGroup);
        page.add(actionGroup);

        window.add(page);

        settings.bind('idle-seconds', idleTimeRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('inhibit-auto-suspend', inhibitAutoSuspendRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('idle-app', idleAppRow, 'text', Gio.SettingsBindFlags.DEFAULT);
        settings.bind('idle-app-args', idleAppArgsRow, 'text', Gio.SettingsBindFlags.DEFAULT);
    }
}