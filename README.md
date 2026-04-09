# ADP Nexus HCM Platform

This repository contains the architecture for the **Advanced Human Capital Management (HCM) Platform**, designed seamlessly for ADP's enterprise environment. The project is split down the middle between an Angular Frontend (`nexus-frontend`) and a Spring Boot Backend (`hcm-backend`), connected securely to a XAMPP MySQL Database.

---

## 🛠️ Prerequisites

Before you start, ensure you have the following installed and running on your system:
1. **Node.js** & **npm** (For the Angular Frontend)
2. **Angular CLI** (Installed globally via `npm install -g @angular/cli`)
3. **Java 17** & **Maven** (For the Spring Boot Backend)
4. **XAMPP Control Panel** (For the MySQL Server Database)

---

## 🚀 How to Run the Database (XAMPP)

Our backend natively hooks into MySQL via XAMPP.
1. Open the **XAMPP Control Panel**.
2. Click **Start** explicitly next to the **MySQL** module.
3. *Note: Spring Boot is configured to auto-create the default database table `adp_hcm` if it does not exist.*

---

## ⚙️ How to Run the Backend (Spring Boot)

The API is structured to process all HR-related requests and security parameters.
1. Open up a brand new Terminal.
2. Navigate into the backend root folder:
   ```bash
   cd hcm-backend
   ```
3. Run the application utilizing Maven Wrapper:
   ```bash
   # On Windows (PowerShell/CMD):
   ./mvnw spring-boot:run
   ```
4. The Backend API will start running safely on **`http://localhost:8080`**.

---

## 🎨 How to Run the Frontend (Angular)

The User Interface consists of dynamic Web Components colored mathematically to match ADP's visual syntax.
1. Open a new, separate Terminal.
2. Navigate into the frontend root folder:
   ```bash
   cd nexus-frontend
   ```
3. Boot the development server and open it instantly in your Default Web Browser:
   ```bash
   ng serve -o
   ```
4. The Angular UI Server will start rendering exclusively on **`http://localhost:4200`**.

---

### End-to-End Testing Check
If both servers are running simultaneously, you have successfully set up the Full-Stack Developer Environment! Changes made to the Angular HTML/CSS code will trigger auto-refreshes in your browser. Any modified Backend Spring features will require a restart of the `./mvnw spring-boot:run` environment to commit compiled code changes.
# HCMNexus
