import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AddConsorcioComponent} from './add-consorcio.component';

describe('AddConsorcioComponent', () => {
  let component: AddConsorcioComponent;
  let fixture: ComponentFixture<AddConsorcioComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddConsorcioComponent]
    });
    fixture = TestBed.createComponent(AddConsorcioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
