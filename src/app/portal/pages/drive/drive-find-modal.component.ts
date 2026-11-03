import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface DriveFindResult {
  title: string;
  preview: string;
}

@Component({
  selector: 'app-drive-find-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drive-find-modal.component.html',
  styleUrls: ['./drive-find-modal.component.scss']
})
export class DriveFindModalComponent {
  @Input() title = 'Buscar';
  @Input() query = '';
  @Input() busy = false;
  @Input() results: DriveFindResult[] = [];
  @Input() activeIndex = -1;
  @Output() queryChange = new EventEmitter<string>();
  @Output() search = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  @Output() select = new EventEmitter<number>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  public onQuery(value: string): void {
    this.query = value;
    this.queryChange.emit(value);
  }
}
