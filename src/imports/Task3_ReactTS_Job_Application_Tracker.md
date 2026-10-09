**Topic:** ReactTS
**Submission Date:** 07 October 2025
**Time:** 09:00

Please submit by pushing to your GitHub repository and submitting the submission form

# Title: Task 3 - ReactTS Job Application Tracker

## Objective

The objective of this task is to assess your understanding of React navigation, routing, URL queries and URL parameters, while testing your research skills when it comes to finding out ways to use new technology.

This is the third official task for React based on Lesson 3.

**Scenario:** You are tasked with building a simple (MVP) of a web application that allows job applicants to track the number of jobs they've applied for, which will help them assess how many applications are successful, pending and rejected. (You can extend the app in your free time to add more functionality such as an actual database, as this is only a mock application).

## Requirements

### Interface

- Create a user-friendly interface that is intuitive and easy to use
- The interface should be responsive to different screens
- Interface should make use of aesthetically pleasing color combinations
- The interface should have a good layout that is easy to navigate

### Pages

- Six Pages: Login, Registration, Home, landing, more details page (job page), 404 page
- **Registration Page:** New users can register with the following details:
  - Username
  - Password
- **Login Page:** Users can log in with their credentials.
- **Home Page:** Display Jobs you applied for
- **Landing Page:** Displays details about the purpose of the web application. You can be creative in terms of the other details to include
- **Job Page:** This page can be used to display more details about the job and the company, such as address, contact details, duties, requirements, and any data applicants could find relevant to know about the company for interview purposes. You can use your creativity to see what details you want users to optionally add, bear in mind to include all necessary inputs.
- **404 page:** Catch all non-existent paths

### Functionality

- **Add Function:** Users can add new jobs to the Job Application Tracker with the following details:
  - Company name
  - Role
  - Status: Applied, Interviewed, Rejected
  - Date applied
  - Job duties
- **Delete Function:** Users can delete existing Jobs from the job-application-tracker.
- **Update Function:** Users can edit existing jobs on the job-application tracker.
- **Search Function:** Users can search for items by company or role. The searched item should reflect on the URL bar
- **Status colors:** use colours to represent status (e.g., Red for Rejected, Yellow for Applied, Green for Interviewed).
- **Filter function:** Users can filter the jobs according to job status. The filter should reflect on the URL bar
- **Sort function:** Users can sort by date. Descending and ascending. This should reflect on the URL bar

### General Requirements

- Use the previous design (color scheme, design style, and properties) to formulate a new design for the application
- Implement CRUD (Create, Read, Update, Delete) operations to meet the functional requirements of the application
- Use JSON server to store the link details
- Ensure the application is responsive and user-friendly
- Implement user authentication and authorization to protect user data
- Make sure to use queries and parameters in your application, allowing users to interact with the application from the URL bar while ensuring predictable results when the URL is updated.
- Use proper validation for input fields to prevent errors.
- Use protected routing in relevant routes/paths

### Persistence

- Make use of JSON server to store the link details

## Concepts the task covers

- Arrays and array methods
- Objects and object method
- React components
- React state
- React props
- React hooks
- JSON object and its methods
- Web page responsiveness
- Form validation
- Design principles
- React router navigation
- Git principles
- Git cloning
- Git branching
- Pull requests

## Resources

- JSON server
- React Router
- React
- Mozilla Developer: Flexbox basics
- CSS Tricks: CSS Grid Layout
- W3Schools: Git

## Instructions

- Come up with your own design for the problem statement
- Use the design to guide your UI
- Use the agreed logic design tools to plan your functionality
- Follow your logic design tools to create the algorithm of the application
- Test your application
- Create a readme file for the application
- Push your updates to the remote repo
- Create a pull request to your main branch before the due date, with your mentor assigned

## Deliverables

- Design file
- Step by step planning
- Pseudo code
- Design Implementation
- Algorithm

## Evaluation Criteria

### User-friendliness of the design

- Is the design intuitive
- Does the design have a proper and understandable layout
- Does the app flow from one function to another in an understandable and easy to follow manner
- Does the app show notifications for processes occurring in the background
- Does the app use colors that make it easy for users to see everything on the UI
- Are elements easily accessible: colors, pressable height and width, font sizes
- Screen reader friendliness/accessibility considered
- Navigation segments are easily noticeable and accessible

### Aesthetics of the design

- Does the design have colors that blend well together
- Does the design maintain a consistent typography
- Does the design have a consistent layout
- Does the design have a consistent spacing on the same screen sizes

### Page interactivity

- Does the mouse cursor change when hovering over clickable elements
- Do clickable elements change color when hovered over
- Do buttons change states after onclicks and while processing
- Are loaders utilised while processing where relevant

### Proper utilisation of ReactTS features

- Did trainee create their own components
- Were the components reused where appropriate
- Was React state utilised properly
- Were props sent to components and handled properly
- Both representational and container components utilised
- Were reused components customised for similar design elements instead of creating new elements

### React router features

- React libraries (React router recommended) utilised for navigation
- Navlink used (in place of a tags) to route pages
- Queries utilised
- Parameters utilised
- Protected routes utilised, and utilised correctly
- All page 404s handled correctly

### Responsiveness of the page

Is the page responsive to different web view sizes at different breakpoints, below is an example of common breakpoints:

- 320px
- 480px
- 768px
- 1024px
- 1200px
