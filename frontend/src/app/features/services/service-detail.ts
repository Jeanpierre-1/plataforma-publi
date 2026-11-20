import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Breadcrumbs } from '../../shared/ui/breadcrumbs/breadcrumbs';
import { Button } from '../../shared/ui/button/button';
import { ProjectCta } from '../../shared/ui/project-cta/project-cta';
import { ServiceContent } from './service-content';

@Component({
  selector: 'app-service-detail',
  imports: [NgOptimizedImage, RouterLink, Breadcrumbs, Button, ProjectCta],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.css',
  host: { '[class.is-print]': "service().theme === 'print'" },
})
export class ServiceDetail {
  readonly service = input.required<ServiceContent>();
}
