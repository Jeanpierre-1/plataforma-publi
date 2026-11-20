import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_NAME } from '../../core/config/site-config';
import { Breadcrumbs } from '../../shared/ui/breadcrumbs/breadcrumbs';
import { Icon } from '../../shared/ui/icon/icon';
import { ProjectCta } from '../../shared/ui/project-cta/project-cta';
import { EVENTS_CONTENT, PRINT_CONTENT } from '../services/service-content';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink, Breadcrumbs, Icon, ProjectCta],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css',
})
export class Portfolio {
  protected readonly siteName = SITE_NAME;
  protected readonly services = [EVENTS_CONTENT, PRINT_CONTENT];
}
