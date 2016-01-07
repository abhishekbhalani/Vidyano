﻿module Vidyano.WebComponents {
    @Dialog.register({
        properties: {
            persistentObject: Object,
            tab: {
                type: Object,
                computed: "_computeTab(persistentObject)"
            },
            readOnly: {
                type: Boolean,
                computed: "_computeReadOnly(tab)"
            }
        },
        hostAttributes: {
            "dialog": ""
        }
    })
    export class PersistentObjectDialog extends Dialog {
        private _saveHook: (po: Vidyano.PersistentObject) => Promise<any>;
        tab: Vidyano.PersistentObjectAttributeTab;

        constructor(public persistentObject: Vidyano.PersistentObject, private _forwardSave: boolean = false) {
            super();

            persistentObject.beginEdit();
        }

        private _save() {
            if (this._forwardSave)
                this.instance.resolve(this.persistentObject);
            else {
                var wasNew = this.persistentObject.isNew;
                this.persistentObject.save().then(() => {
                    if (StringEx.isNullOrWhiteSpace(this.persistentObject.notification) || this.persistentObject.notificationType != NotificationType.Error) {
                        if (wasNew && this.persistentObject.ownerAttributeWithReference == null && this.persistentObject.stateBehavior.indexOf("OpenAfterNew") != -1)
                            this.app.service.getPersistentObject(this.persistentObject.parent, this.persistentObject.id, this.persistentObject.objectId).then(po2 => {
                                this.app.service.hooks.onOpen(po2, true);
                                this.instance.resolve(this.persistentObject);
                            }, e => {
                                this.instance.resolve(this.persistentObject);
                                var owner: ServiceObjectWithActions = this.persistentObject.ownerQuery || this.persistentObject.parent;
                                if (!!owner)
                                    owner.setNotification(e);
                            });
                        else
                            this.instance.resolve(this.persistentObject);
                    }
                });
            }
        }

        private _cancel() {
            if (this.persistentObject) {
                this.persistentObject.cancelEdit();
                this.cancel();
            }
        }

        private _computeTab(persistentObject: Vidyano.PersistentObject): Vidyano.PersistentObjectAttributeTab {
            if (!persistentObject)
                return null;

            var tab = <Vidyano.PersistentObjectAttributeTab>Enumerable.from(persistentObject.tabs).firstOrDefault(tab => tab instanceof Vidyano.PersistentObjectAttributeTab);
            tab.columnCount = tab.columnCount > 1 ? tab.columnCount : 1;

            return tab;
        }

        private _computeReadOnly(tab: Vidyano.PersistentObjectAttributeTab): boolean {
            return !tab.attributes.some(attribute => !attribute.isReadOnly && attribute.isVisible);
        }

        private _onSelectAction(e: Event) {
            this.instance.resolve(parseInt((<HTMLElement>e.target).getAttribute("data-action-index"), 10));

            e.stopPropagation();
        }
    }
}