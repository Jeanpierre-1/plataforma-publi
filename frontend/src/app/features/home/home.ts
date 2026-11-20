import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_NAME } from '../../core/config/site-config';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ServicesSection } from './services-section';

@Component({
  selector: 'app-home',
  imports: [NgOptimizedImage, RouterLink, Button, Icon, ServicesSection],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly siteName = SITE_NAME;
}
