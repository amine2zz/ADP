import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
  templateUrl: './setup.component.html',
  styleUrls: ['../login/login.component.css']
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

    const payload = {
      token: this.token,
      newPassword: (form.elements.namedItem('password') as HTMLInputElement).value,
      address: (form.elements.namedItem('address') as HTMLInputElement).value,
      phoneNumber: (form.elements.namedItem('phone') as HTMLInputElement).value,
      dateOfBirth: (form.elements.namedItem('dob') as HTMLInputElement).value
    };

    this.http.post('http://localhost:8085/api/employees/setup', payload).subscribe({
      next: () => {
        alert("Account Activated Successfully! Welcome to ADP Nexus.");
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert("Setup Failed: " + (err.error?.message || "Invalid Token"));
      }
    });
  }
}
