import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { exec } from 'child_process';
import * as path from 'path';

interface SmaugSettings {
    smaugDirectory: string;
}

const DEFAULT_SETTINGS: SmaugSettings = {
    smaugDirectory: ''
}

export default class SmaugPlugin extends Plugin {
    settings: SmaugSettings;

    async onload() {
        await this.loadSettings();

        // Ribbon Icon
        this.addRibbonIcon('dragon', 'Run Smaug Archiver', (evt: MouseEvent) => {
            this.runSmaugJob();
        });

        // Command Palette
        this.addCommand({
            id: 'run-smaug',
            name: 'Run Smaug Bookmark Archiver',
            callback: () => {
                this.runSmaugJob();
            }
        });

        // Settings Tab
        this.addSettingTab(new SmaugSettingTab(this.app, this));
    }

    onunload() {
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    runSmaugJob() {
        if (!this.settings.smaugDirectory) {
            new Notice('Smaug: Please configure the Smaug project directory in settings first.');
            return;
        }

        new Notice('🐉 Smaug is waking up... processing bookmarks...');

        // Command to execute the local project's run command
        const command = `npx smaug run`;

        exec(command, { cwd: this.settings.smaugDirectory }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Smaug execution error: ${error.message}`);
                new Notice('❌ Smaug failed! Check developer console for details.');
                return;
            }
            if (stderr) {
                console.warn(`Smaug stderr: ${stderr}`);
            }

            console.log(`Smaug output: ${stdout}`);

            if (stdout.includes("No bookmarks to process")) {
                new Notice('🐉 Smaug: No new bookmarks to hoard.');
            } else {
                new Notice('🐉 Smaug finished hoarding! New bookmarks archived.');
            }
        });
    }
}

class SmaugSettingTab extends PluginSettingTab {
    plugin: SmaugPlugin;

    constructor(app: App, plugin: SmaugPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl('h2', { text: 'Smaug Archiver Settings' });

        new Setting(containerEl)
            .setName('Smaug Project Directory')
            .setDesc('Absolute path to where you cloned the smaug-obsidian repository (e.g. /Users/mayanklavania/moonshot_projects/smaug-obsidian)')
            .addText(text => text
                .setPlaceholder('Enter directory')
                .setValue(this.plugin.settings.smaugDirectory)
                .onChange(async (value) => {
                    this.plugin.settings.smaugDirectory = value;
                    await this.plugin.saveSettings();
                }));
    }
}
