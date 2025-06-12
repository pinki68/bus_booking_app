Online Bus Ticket Booking Application 
1. Setting Up Backend (Spring Boot)
  A. Initialize Spring Boot Project
 Use Spring Initializr to create a new Spring Boot project.
  Include dependencies:
    Spring Web
   Spring Data JPA
   MySQL Driver
   Spring Security
   Validation
   JWT (via custom config or third-party library)

B. Define Entities
  Bus: Represents bus information such as source, destination, date, time, and available seats.
  Booking: Captures booking details, user association, seat count, etc.
  Passenger/User: Stores user information like name, email, password, and roles.

-----------------------------------------------------------------------------------------
C. Implement RESTful APIs
  Use @RestController to expose endpoints for:
  User Registration and Authentication
  Fetching bus routes
  Booking tickets
  Viewing booking history
  
-----------------------------------------------------------------
D. Database Configuration
  Use MySQL as the backend database.
  Configure in application.properties:
  Ensure all entities are annotated with JPA annotations.

------------------------------------------------------------

2. Setting Up Frontend (HTML, CSS, JavaScript or Thymeleaf)
  A. UI Design
      Use HTML and Thymeleaf templates or JavaScript-based views.
      Pages include:
      Home Page
      Bus Search Page
      Booking Page
      Login/Registration
      Profile Page
      Booking History

B. Styling
  Use Bootstrap for responsive and styled components.
  Ensure mobile-friendly layout and user-friendly forms.

------------------------------------------------

3. User Registration and Authentication
  1. User Registration
      HTML form to collect name, email, and password.
      Client-side validation using JavaScript.
      Server-side validation using annotations like @NotBlank, @Email, etc.
      Spring Boot API to save user data securely.
2. User Authentication
    Login form to collect credentials.
    Use Spring Security and JWT for authentication.
    Generate and send JWT token upon successful login.
    Store JWT in localStorage/sessionStorage on the frontend

--------------------------------------------------------

4. Bus Ticket Booking
1. Browse and Select Bus Routes
    Input fields: From, To, Date.
    Use JavaScript to fetch available routes via REST API.
    Display results in a table or card layout.
2. Booking Process
    Allow user to select a route and enter passenger details.
    Send booking details to backend via POST request.
    Show confirmation and e-ticket on success.

---------------------------------------------
5. User Profile and Booking History
    1. User Profile
      Show user data with an option to edit.
      Allow password change (with proper validation).
      Placeholder for managing payment methods (optional).
    2. Booking History
      Fetch bookings using a REST API.
      Display in tabular format with fields like date, route, seat count, etc.

---------------------------------------------------------
6. Testing
    A. Unit Testing
      Use JUnit and Mockito for testing services, controllers, and repositories.
      Write test cases for:
      User Registration/Login
      Fetching routes
      Booking flow
      Data validation
    B. Integration Testing
      Use Spring Boot test tools for end-to-end testing.
      Ensure security context is applied during tests.

------------------------------------------------
Notes
  Ensure password encryption using BCrypt.
  Secure APIs using Spring Security filters.
  Validate and sanitize all user inputs.
  Use proper error handling and return meaningful error messages.

-------------------------------------------------------

![Image](https://github.com/user-attachments/assets/93e71fb9-31f0-4d51-a1d6-48841c007e0f)

![Image](https://github.com/user-attachments/assets/c9ac083a-6ec0-46ef-857a-6c2965a0fac9)

![Image](https://github.com/user-attachments/assets/a18033c6-d920-4629-a774-62b493ffd68f)

![Image](https://github.com/user-attachments/assets/84ad4278-0c3b-488f-964a-6b2add48b446)

![Image](https://github.com/user-attachments/assets/d50a6bac-f01c-4812-8874-90bee21a6e48)

![Image](https://github.com/user-attachments/assets/16b66b58-96be-49cf-b780-1b7c5c39d4f2)

![Image](https://github.com/user-attachments/assets/255f4bd8-c163-4d9a-a4f6-eca4d498bd04)

![Image](https://github.com/user-attachments/assets/7c65e6c9-6b1a-4b5d-89eb-aa1adcb3a86a)

![Image](https://github.com/user-attachments/assets/485d04b0-1b90-4302-808d-56f4427d6802)

![Image](https://github.com/user-attachments/assets/ceab1d7f-f351-4c68-8807-28a2d02a93d3)

