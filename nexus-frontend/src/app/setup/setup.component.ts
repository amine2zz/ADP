import { Component, OnInit } from '@angular/core';
import { API_BASE } from '../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './setup.component.html',
  styleUrls: ['../login/login.component.css'] // mathematically re-using the ADP login stylesheet!
})
export class SetupComponent implements OnInit {
  token: string | null = null;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  submitSetup(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    
    // Construct the payload mapping to our Java SetupRequest DTO
    const payload = {
      token: this.token,
      newPassword: (form.elements.namedItem('password') as HTMLInputElement).value,
      address: (form.elements.namedItem('address') as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem('phone') as HTMLInputElement).value,
      dateOfBirth: (form.elements.namedItem('dob') as HTMLInputElement).value
    };

    // Fire the exact HTTP POST request to XAMPP Java
    this.http.post('${API_BASE}/employees/setup', payload).subscribe({
      next: (res) => {
        alert("Account Activated Successfully! Welcome to ADP Nexus.");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert("Setup Failed: " + (err.error?.message || "Invalid Token"));
      }
    });
  }
}


