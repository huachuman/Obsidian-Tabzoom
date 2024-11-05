const { Plugin } = require('obsidian');

class PaneZoomLevelsPlugin extends Plugin {
    async onload() {
        this.zoomLevels = new Map();
        this.zoomStep = 0.1; // 10% zoom step

        // Add command to set custom zoom level
        this.addCommand({
            id: 'set-pane-zoom',
            name: 'Set Custom Zoom Level for Current Pane',
            callback: async () => {
                const leaf = this.app.workspace.activeLeaf;
                if (!leaf) return;

                const currentZoom = this.zoomLevels.get(leaf.id)?.scale || 1;
                const input = await this.promptForZoom(currentZoom);
                if (input !== null) {
                    this.setZoomForPane(leaf, { scale: input / 100 });
                }
            }
        });

        // Add command to zoom in
        this.addCommand({
            id: 'zoom-in',
            name: 'Zoom In',
            callback: () => this.incrementalZoom(true),
            hotkeys: [{ modifiers: ["Alt"], key: "=" }]
        });

        // Add command to zoom out
        this.addCommand({
            id: 'zoom-out',
            name: 'Zoom Out',
            callback: () => this.incrementalZoom(false),
            hotkeys: [{ modifiers: ["Alt"], key: "-" }]
        });

        // Register for layout change events
        this.registerEvent(
            this.app.workspace.on('layout-change', this.reapplyZoomLevels.bind(this))
        );

        // Register for file open events
        this.registerEvent(
            this.app.workspace.on('file-open', this.reapplyZoomLevels.bind(this))
        );
    }

    async promptForZoom(currentZoom) {
        const input = await new Promise(resolve => {
            const modal = new this.app.Modal();
            modal.contentEl.createEl('h2', { text: 'Set Zoom Level' });
            const inputEl = modal.contentEl.createEl('input', {
                type: 'number',
                value: Math.round(currentZoom * 100),
                placeholder: 'Enter zoom level (e.g., 150 for 150%)'
            });
            const buttonEl = modal.contentEl.createEl('button', { text: 'Set' });
            buttonEl.onclick = () => {
                modal.close();
                resolve(inputEl.value);
            };
            modal.open();
        });

        if (!input) return null;
        const numericInput = parseFloat(input);
        return isNaN(numericInput) ? null : Math.max(10, numericInput); // Minimum 10% zoom
    }

    incrementalZoom(zoomIn) {
        const leaf = this.app.workspace.activeLeaf;
        if (!leaf) return;

        const currentZoom = this.zoomLevels.get(leaf.id)?.scale || 1;
        const newZoom = zoomIn ? currentZoom + this.zoomStep : currentZoom - this.zoomStep;
        this.setZoomForPane(leaf, { scale: Math.max(0.1, newZoom) }); // Minimum 10% zoom
    }

    setZoomForPane(leaf, zoomLevel) {
        const leafId = leaf.id;
        const contentEl = leaf.view.contentEl;

        // Find the actual content container
        const contentContainer = contentEl.querySelector('.markdown-preview-view, .markdown-source-view');

        if (!contentContainer) return;

        // Remove transform from any existing zoom level
        contentContainer.style.transform = '';
        contentContainer.style.transformOrigin = '';

        // Apply new zoom level
        if (zoomLevel) {
            contentContainer.style.transform = `scale(${zoomLevel.scale})`;
            contentContainer.style.transformOrigin = 'top left';
            
            // Adjust the container size to accommodate the scaled content
            contentContainer.style.width = `${100 / zoomLevel.scale}%`;
            contentContainer.style.height = `${100 / zoomLevel.scale}%`;
        } else {
            // Reset the container size
            contentContainer.style.width = '';
            contentContainer.style.height = '';
        }

        // Store the zoom level for this pane
        this.zoomLevels.set(leafId, zoomLevel);
    }

    reapplyZoomLevels() {
        this.app.workspace.iterateAllLeaves(leaf => {
            const zoomLevel = this.zoomLevels.get(leaf.id);
            if (zoomLevel) {
                this.setZoomForPane(leaf, zoomLevel);
            }
        });
    }

    onunload() {
        // Remove all zoom transforms when plugin is disabled
        this.app.workspace.iterateAllLeaves(leaf => {
            const contentContainer = leaf.view.contentEl.querySelector('.markdown-preview-view, .markdown-source-view');
            if (contentContainer) {
                contentContainer.style.transform = '';
                contentContainer.style.transformOrigin = '';
                contentContainer.style.width = '';
                contentContainer.style.height = '';
            }
        });
    }
}

module.exports = PaneZoomLevelsPlugin;
