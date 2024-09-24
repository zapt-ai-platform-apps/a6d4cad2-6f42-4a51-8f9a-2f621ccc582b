# Personal Book Tracker

The Personal Book Tracker app allows users to keep track of books they've read, want to read, and are currently reading. It also provides personalized book recommendations and statistics about your reading habits.

## Features

1. **User Authentication**
   - Users can sign in or sign up using ZAPT authentication via Supabase.
   - Social login providers include Google, Facebook, and Apple.
   - The sign-in page includes the text "Sign in with ZAPT" and a link to the ZAPT marketing site.

2. **Add Books**
   - Users can add books to their collection by entering the title, author, and cover image URL.
   - Books can be added with an initial status of "Want to Read", "Currently Reading", or "Read".

3. **Manage Book Collection**
   - View a list of all books added to your collection.
   - Update the status of books:
     - **Want to Read**: Books you plan to read.
     - **Currently Reading**: Books you are currently reading.
     - **Read**: Books you have finished reading.
   - Rate and review books you've finished.
   - Edit or delete books from your collection.

4. **Book Recommendations**
   - Generate personalized book recommendations based on the books you've read and liked.
   - Click the "Get Recommendations" button to receive a list of recommended books generated by ChatGPT.
   - Add recommended books directly to your collection.

5. **Reading Goals**
   - Set annual reading goals (e.g., number of books per year).
   - Track progress towards your reading goals.
   - View a dashboard with your current progress and remaining books to read.

6. **Reading Statistics**
   - View basic statistics about your reading habits:
     - Total books read.
     - Average rating of books you've read.
     - Visualize your reading progress with interactive charts.

## User Journeys

### 1. Sign Up / Log In

- **Step 1**: Open the app.
- **Step 2**: Click "Sign in with ZAPT".
- **Step 3**: Choose to sign in with email or a social provider (Google, Facebook, Apple).
- **Step 4**: Complete the authentication process.
- **Step 5**: Upon successful login, you are redirected to the home page.

### 2. Add a New Book

- **Step 1**: On the home page, click the "Add New Book" button.
- **Step 2**: Fill in the book details:
  - Title
  - Author
  - Cover Image URL
  - Status ("Want to Read", "Currently Reading", "Read")
- **Step 3**: Click "Save Book".
- **Step 4**: The book is added to your collection and displayed in the list.

### 3. Update Book Status

- **Step 1**: Navigate to your book collection on the home page.
- **Step 2**: Find the book you want to update.
- **Step 3**: Click on the status dropdown and select the new status.
- **Step 4**: Optionally, add a rating and review if the status is "Read".
- **Step 5**: Click "Update" to save changes.

### 4. Generate Book Recommendations

- **Step 1**: On the home page, click the "Get Recommendations" button.
- **Step 2**: Wait for the recommendations to generate (loading state displayed).
- **Step 3**: A list of recommended books is displayed.
- **Step 4**: For each recommended book, you can:
  - View details.
  - Add the book to your collection.

### 5. Set Reading Goals

- **Step 1**: Navigate to the "Reading Goals" section on the home page.
- **Step 2**: Enter your desired number of books to read for the year.
- **Step 3**: Click "Set Goal".
- **Step 4**: Your progress is tracked and displayed on the dashboard.

### 6. View Reading Statistics

- **Step 1**: On the home page, scroll to the "Statistics" section.
- **Step 2**: View your reading statistics, such as:
  - Total books read.
  - Average rating.
  - Progress towards reading goals.
  - Visual charts displaying your reading habits.

### 7. Sign Out

- **Step 1**: Click the "Sign Out" button in the header.
- **Step 2**: You are logged out and redirected to the login page.