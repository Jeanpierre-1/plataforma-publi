import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, IconName } from '../../shared/ui/icon/icon';

interface ServiceOverview {
  readonly number: string;
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly path: string;
  readonly linkLabel: string;
}

@Component({
  selector: 'app-services-section',
  imports: [RouterLink, Icon],
  templateUrl: './services-section.html',
  styleUrl: './services-section.css',
})
export class ServicesSection {
  protected readonly services: readonly ServiceOverview[] = [
    {
      number: '01',
      icon: 'stage',
      title: 'Eventos que se viven.',
      description: 'Organización y producción de eventos musicales de cumbia y folklore.',
      tags: ['Cumbia', 'Folklore'],
      path: '/eventos',
      linkLabel: 'Explorar eventos',
    },
    {
      number: '02',
      icon: 'print',
      title: 'Ideas en gran formato.',
      description:
        'Paneles, pasacalles y gigantografías para dar visibilidad a tu marca, campaña o evento.',
      tags: ['Paneles', 'Pasacalles', 'Gigantografías'],
      path: '/impresiones',
      linkLabel: 'Explorar impresiones',
    },
  ];
}
