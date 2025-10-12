import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendAdminEmailComponent } from './send-admin-email.component';

describe('SendAdminEmailComponent', () => {
  let component: SendAdminEmailComponent;
  let fixture: ComponentFixture<SendAdminEmailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SendAdminEmailComponent]
    });
    fixture = TestBed.createComponent(SendAdminEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
