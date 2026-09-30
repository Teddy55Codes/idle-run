'use strict';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const DBusSessionManagerIface = '<node>\
  <interface name="org.gnome.SessionManager">\
    <method name="Inhibit">\
        <arg type="s" direction="in" />\
        <arg type="u" direction="in" />\
        <arg type="s" direction="in" />\
        <arg type="u" direction="in" />\
        <arg type="u" direction="out" />\
    </method>\
    <method name="Uninhibit">\
        <arg type="u" direction="in" />\
    </method>\
  </interface>\
</node>';

const DBusSessionManagerProxy = Gio.DBusProxy.makeProxyWrapper(DBusSessionManagerIface);

const State = {
    ACTIVE: 0,
    IDLE: 1,
    RUNNING: 2
};

export default class PlainExampleExtension extends Extension {
    enable() {
        this._sessionManager = new DBusSessionManagerProxy(Gio.DBus.session,
            'org.gnome.SessionManager',
            '/org/gnome/SessionManager');

        this._settings = this.getSettings();
        this._syncSettings();

        this._settingsSignalsIds = [
            this._settings.connect('changed::idle-seconds', () => this._syncSettings()),
            this._settings.connect('changed::inhibit-auto-suspend', () => this._syncSettings()),
            this._settings.connect('changed::idle-app', () => this._syncSettings()),
            this._settings.connect('changed::idle-app-args', () => this._syncSettings())
        ]

        this._state = State.ACTIVE; 
    }

    disable() {
        for (const signal in this._settingsSignalsIds) {
            this._settings.disconnect(signal);
        }

        this._settings = null;

        try {
            this._removeIdleMonitor();
            this._removeInhibitor()
        } catch (e) {
            logError(e, `[Idle-run] Error during disabling of extension`);
        }
    }

    _setupIdleMonitor() {
        try {
            this._idleMonitor = global.backend.get_core_idle_monitor();        
            this._idleWatchId = this._idleMonitor.add_idle_watch(this._idleSeconds * 1000, () => this._onSystemIdle());
        } catch (e) {
            logError(e, `[Idle-run] Error setting up idle monitor`);
        }
    }


    _removeIdleMonitor() {
        if (this._idleMonitor) {
            if (this._idleWatchId) this._idleMonitor.remove_watch(this._idleWatchId);
            if (this._activeWatchId) this._idleMonitor.remove_watch(this._activeWatchId);
            
            this._idleWatchId = null;
            this._activeWatchId = null;
            this._idleMonitor = null;
        }

        this._stopApp();
    }

    _armActiveWatch() {
        if (!this._idleMonitor || this._activeWatchId) return;

        this._activeWatchId = this._idleMonitor.add_user_active_watch(() => {
            this._activeWatchId = null;
            this._onSystemActive();
        });
    }

    _syncSettings() {
        this._removeIdleMonitor();

        this._idleSeconds = this._settings.get_int('idle-seconds');
        this._inhibit_auto_suspend = this._settings.get_boolean('inhibit-auto-suspend');
        this._idleApp = this._settings.get_string('idle-app');
        this._idleAppArgs = this._settings.get_string('idle-app-args');

        this._setupIdleMonitor();
    }

    _onSystemIdle() {
        if (this._state === State.RUNNING) return;
        this._state = State.IDLE;
        this._armActiveWatch();
        if (this._inhibit_auto_suspend) {
            this._setupInhibitor();
        }

        this._runApp();
    }

    _onSystemActive() {
        if (this._state === State.ACTIVE) return;
        this._state = State.ACTIVE;
        if (this._inhibit_auto_suspend) {
            this._removeInhibitor();
        }

        this._stopApp();
    }

    _setupInhibitor() {
        this._inhibitorCookie = this._sessionManager.call_sync(
            'Inhibit', 
            GLib.Variant.new_tuple(
                [
                    GLib.Variant.new_string('idle-run-gnome-extension'),
                    GLib.Variant.new_uint32(0),
                    GLib.Variant.new_string('Inhibited by Idle Run GNOME extension'),
                    GLib.Variant.new_uint32(4) // disable suspending
                ]
            ),
            Gio.DBusCallFlags.NONE, -1, null)
            .get_child_value(0).get_uint32();

        if (!this._inhibitorCookie) {
            logError(new Error('[idle-run] Failed to add inhibitor'));
        }
    }

    _removeInhibitor() {
        if (!this._inhibitorCookie) return;
        this._sessionManager.UninhibitRemote(this._inhibitorCookie);
        this._inhibitorCookie = null;
    }

    _runApp() {
        if (!this._idleApp) return; 

        if (this._idleAppArgs) {
            this._subProc = new Gio.Subprocess({
                    argv: [this._idleApp, ...this._idleAppArgs.split(" ")],
                    flags: Gio.SubprocessFlags.NONE
                });
        } else {
            this._subProc = new Gio.Subprocess({
                    argv: [this._idleApp],
                    flags: Gio.SubprocessFlags.NONE
                });
        }
        
            
        this._subProc.init(null);

        this._subProc.wait_async(null, (proc, res) => {
                try {
                    proc.wait_finish(res);
                    if (!proc.get_successful()) {
                        if (this._state === State.RUNNING) {
                            logError(new Error('[Idle-run] spawned subprocess stopped'));
                            if (this._subProc === proc) this._subProc = null;
                            return;
                        }
                    }
                } catch(e) {
                    logError(e, `[Idle-run] wait on subprocess failed`);
                }

                if (this._subProc === proc) this._subProc = null;

                if (this._state === State.RUNNING) {
                    this._state = State.ACTIVE;
                }
            });
    }

    _stopApp() {
        if (!this._subProc) return;

        this._subProc.send_signal(15); // SIGTERM
    }
}
