import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneradorRecibosComponent } from './generador-recibos.component';

describe('GeneradorRecibosComponent', () => {
  let component: GeneradorRecibosComponent;
  let fixture: ComponentFixture<GeneradorRecibosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneradorRecibosComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneradorRecibosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
