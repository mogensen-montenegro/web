import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulletsComponent } from './bullets.component';

describe('BulletsComponent', () => {
  let component: BulletsComponent;
  let fixture: ComponentFixture<BulletsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BulletsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulletsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
