import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerFuncionalidadHeaderComponent } from './banner-funcionalidad-header.component';

describe('BannerFuncionalidadHeaderComponent', () => {
  let component: BannerFuncionalidadHeaderComponent;
  let fixture: ComponentFixture<BannerFuncionalidadHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BannerFuncionalidadHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerFuncionalidadHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
