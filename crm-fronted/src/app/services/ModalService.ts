// modal.service.ts
import { Injectable, TemplateRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalService {
  private overlayRef: OverlayRef | null = null;

  constructor(private overlay: Overlay) { }

  open(viewContainerRef: ViewContainerRef, template: TemplateRef<any>) {
    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'dark-backdrop',
      panelClass: 'modal-panel',
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const portal = new TemplatePortal(template, viewContainerRef);
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => this.close());
  }

  close() {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
