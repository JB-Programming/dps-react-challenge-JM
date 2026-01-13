# DPS Frontend Coding Challenge: German Address Validator #

Your task is to build a small web application that validates German postal codes (PLZ) and localities using the **Open PLZ API**.
API reference: https://www.openplzapi.org/en/germany.

## Project Setup

This repository comes **pre-configured with React and Vite**. You are free to use additional tools or libraries.
You may either fork this repository or create a new one and restructure the application as you see fit.

## Environment Setup

Ensure you have Node.js (v14.x or later) and npm (v6.x or later) installed.  
To set up and run the application, execute the following commands:

```
npm install
npm run dev
```

The application will then be accessible at http://localhost:3000.

## Project Description

Create an address input form with two required fields.
- **Locality** (city/town name)
- **Postal Code (PLZ)**
These fields must validate each other using live data from the Open PLZ API.

**Usage scenarios.**
1. Lookup by locality. When the user types a city/town name:
- If one postal code exists for this locality → automatically fill the PLZ field.
- If multiple postal codes exist → convert the PLZ field into a dropdown.
2. Lookup by postal code. When the user enters a PLZ:
- If PLZ is valid → automatically fill the locality field.
- If PLZ is invalid → show an error message.

[Optional task] **Debounce**. Implement a 1-second debounce on both inputs before API calls.

## AI Usage Rules

You are allowed to use AI tools to complete this task. However, **transparency is required**.
Please include a small artifact folder or a markdown section with:
- Links to ChatGPT / Claude / Copilot conversations
- Any prompts used (copy/paste the prompt text if links are private)
- Notes about what parts were AI-assisted
- Any generated code snippets you modified or rejected

This helps us understand your workflow and decision-making process, not to judge AI usage.

Happy coding!

## Solution

The requierements have been fullfilled.

Additonally functions:
1. The optional debounce was added
2. Since in Germany one PLZ can have multiple cities a drop down was also added for the city input, if the API has returned more than one result for the searched postal code
3. A reset button has been added to reset both inputs when clicked
4. A display area was setup to see which city / PLZ in which area was chosen

Regarding AI usage:
During the creation of the project GitHub Copilot and GitHub Copilot Autocompletion was used.
The conversation and usage of GitHub Copilot can be seen in the "AI_usage.txt"-File.


