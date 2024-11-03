const { Plugin } = require('obsidian');

class PaneZoomLevelsPlugin extends Plugin {
    async onload() {
        this.zoomLevels = new Map();

        // Add command to set zoom level
        this.addCommand({
            id: 'set-pane-zoom',
            name: 'Set Zoom Level for Current Pane',
            callback: async () => {
                const leaf = this.app.workspace.activeLeaf;
                if (!leaf) return;

                const zoomLevels = ['zoom-10', 'zoom-20', 'zoom-30', 'zoom-40', 'zoom-50', 'zoom-60', 'zoom-70', 'zoom-80', 'zoom-90','zoom-100'];
                const selected = await this.showZoomSelector(zoomLevels);
                
                if (selected) {
                    this.setZoomForPane(leaf, selected);
                }
            }
        });

        // Register for layout change events
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.reapplyZoomLevels();
            })
        );

        // Register for file open events
        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                this.reapplyZoomLevels();
            })
        );
    }

    async showZoomSelector(options) {
        const modal = new ZoomSelectorModal(this.app, options);
        return new Promise(resolve => {
            modal.onChooseItem = (item) => {
                resolve(item);
                modal.close();
            };
            modal.open();
        });
    }

    setZoomForPane(leaf, zoomClass) {
        const leafId = leaf.id;
        
        // Remove any existing zoom classes
        const container = leaf.view.containerEl;
        container.classList.remove('zoom-10', 'zoom-20', 'zoom-30', 'zoom-40', 'zoom-50', 'zoom-60', 'zoom-70', 'zoom-80', 'zoom-90','zoom-100');
        
        // Add new zoom class
        container.classList.add(zoomClass);
        
        // Store the zoom level for this pane
        this.zoomLevels.set(leafId, zoomClass);
    }

    reapplyZoomLevels() {
        this.app.workspace.iterateAllLeaves(leaf => {
            const zoomClass = this.zoomLevels.get(leaf.id);
            if (zoomClass) {
                leaf.view.containerEl.classList.remove('zoom-10', 'zoom-20', 'zoom-30', 'zoom-40', 'zoom-50', 'zoom-60', 'zoom-70', 'zoom-80', 'zoom-90','zoom-100');
                leaf.view.containerEl.classList.add(zoomClass);
            }
        });
    }

    onunload() {
        // Remove all zoom classes when plugin is disabled
        this.app.workspace.iterateAllLeaves(leaf => {
            leaf.view.containerEl.classList.remove('zoom-10', 'zoom-20', 'zoom-30', 'zoom-40', 'zoom-50', 'zoom-60', 'zoom-70', 'zoom-80', 'zoom-90','zoom-100');
        });
    }
}

class ZoomSelectorModal extends require('obsidian').FuzzySuggestModal {
    constructor(app, options) {
        super(app);
        this.options = options;
    }

    getItems() {
        return this.options;
    }

    getItemText(item) {
        return item.replace('zoom-', '') + '%';
    }

    onChooseItem(item) {
        return item;
    }
}

module.exports = PaneZoomLevelsPlugin;
