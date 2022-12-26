import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  items!: MenuItem[];

  ngOnInit() {
    this.items = [
      {
        label: 'Увійти',
        icon: 'pi pi-fw pi-user',
        routerLink: ['login'],
      },
      {
        label: 'Реєстрація',
        icon: 'pi pi-fw pi-user-plus',
        routerLink: ['register'],
      },
      {
        label: 'Головна',
        icon: 'pi pi-fw pi-home',
        routerLink: ['home'],
      },
      {
        label: 'Гравці',
        icon: 'pi pi-fw pi-user',
        routerLink: ['users'],
      },

      {
        label: 'Вийти',
        icon: 'pi pi-fw pi-power-off',
        routerLink: ['login'],
      }
    ];
  }
}
