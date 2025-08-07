import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddAdministradorComponent } from './add-administrador.component';

describe('AddAdministradorComponent', () => {
  let component: AddAdministradorComponent;
  let fixture: ComponentFixture<AddAdministradorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddAdministradorComponent]
    });
    fixture = TestBed.createComponent(AddAdministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
