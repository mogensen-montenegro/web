import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerCentralComponent } from './banner-central.component';

describe('BannerCentralComponent', () => {
  let component: BannerCentralComponent;
  let fixture: ComponentFixture<BannerCentralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BannerCentralComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerCentralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
