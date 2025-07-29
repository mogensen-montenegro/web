import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsorciosComponent } from './consorcios.component';

describe('ConsorciosComponent', () => {
  let component: ConsorciosComponent;
  let fixture: ComponentFixture<ConsorciosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsorciosComponent]
    });
    fixture = TestBed.createComponent(ConsorciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
