```jsx
import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { supabase, createEvent } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SolidMarkdown } from 'solid-markdown';
import { Chart, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale } from 'chart.js';
import { Doughnut } from 'solid-chartjs';

// Register Chart.js components
onMount(() => {
  Chart.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale);
});

function App() {
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [books, setBooks] = createSignal([]);
  const [newBook, setNewBook] = createSignal({ title: '', author: '', status: 'Want to Read' });
  const [loading, setLoading] = createSignal(false);
  const [recommendations, setRecommendations] = createSignal([]);
  const [goal, setGoal] = createSignal('');
  const [stats, setStats] = createSignal({ totalBooks: 0, averageRating: 0 });
  const [goalLoading, setGoalLoading] = createSignal(false);

  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(() => {
    checkUserSignedIn();
  });

  createEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentPage('homePage');
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage('login');
  };

  const fetchBooks = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/getBooks', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      setBooks(data);
    } else {
      console.error('Error fetching books:', response.statusText);
    }
    setLoading(false);
  };

  const saveBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/saveBook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBook())
      });
      if (response.ok) {
        const savedBook = await response.json();
        setBooks([...books(), savedBook]);
        setNewBook({ title: '', author: '', status: 'Want to Read' });
      } else {
        console.error('Error saving book');
      }
    } catch (error) {
      console.error('Error saving book:', error);
    }
    setLoading(false);
  };

  const updateBookStatus = async (bookId, status, rating, review) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/updateBookStatus', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: bookId, status, rating, review })
      });
      if (response.ok) {
        const updatedBooks = books().map(book => {
          if (book.id === bookId) {
            return { ...book, status, rating, review };
          }
          return book;
        });
        setBooks(updatedBooks);
      } else {
        console.error('Error updating book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/getStats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGoal(data.goal);
        setStats({ totalBooks: data.totalBooks, averageRating: data.averageRating });
      } else {
        console.error('Error fetching stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  createEffect(() => {
    if (user()) {
      fetchBooks();
      fetchStats();
    }
  });

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      const result = await createEvent('chatgpt_request', {
        prompt: 'Based on these books: ' + books().map(book => book.title).join(', ') + '. Give me a list of 5 book recommendations with titles and authors in JSON format as { "recommendations": [ { "title": "", "author": "" } ] }',
        response_type: 'json'
      });
      if (result && result.recommendations) {
        setRecommendations(result.recommendations);
      } else {
        console.error('Invalid recommendations response:', result);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
    }
    setLoading(false);
  };

  const saveGoal = async (e) => {
    e.preventDefault();
    setGoalLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const currentYear = new Date().getFullYear();
    try {
      const response = await fetch('/api/saveGoal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ year: currentYear, target: parseInt(goal(), 10) })
      });
      if (response.ok) {
        console.log('Goal saved');
        fetchStats();
      } else {
        console.error('Error saving goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
    setGoalLoading(false);
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 p-4 text-gray-800">
      <Show when={currentPage() === 'homePage'} fallback={
        <div class="flex items-center justify-center min-h-screen">
          <div class="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold mb-6 text-center text-green-600">Sign in with ZAPT</h2>
            <a
              href="https://www.zapt.ai"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-500 hover:underline mb-6 block text-center"
            >
              Learn more about ZAPT
            </a>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'facebook', 'apple']}
              magicLink={true}
            />
          </div>
        </div>
      }>
        <div class="max-w-7xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold text-green-600">Personal Book Tracker</h1>
            <button
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div class="col-span-1">
              <h2 class="text-2xl font-bold mb-4 text-green-600">Add New Book</h2>
              <form onSubmit={saveBook} class="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newBook().title}
                  onInput={(e) => setNewBook({ ...newBook(), title: e.target.value })}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                  required
                />
                <input
                  type="text"
                  placeholder="Author"
                  value={newBook().author}
                  onInput={(e) => setNewBook({ ...newBook(), author: e.target.value })}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                  required
                />
                <select
                  value={newBook().status}
                  onChange={(e) => setNewBook({ ...newBook(), status: e.target.value })}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                >
                  <option value="Want to Read">Want to Read</option>
                  <option value="Currently Reading">Currently Reading</option>
                  <option value="Read">Read</option>
                </select>
                <button
                  type="submit"
                  class={`w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading()}
                >
                  {loading() ? 'Saving...' : 'Save Book'}
                </button>
              </form>
            </div>

            <div class="col-span-1 md:col-span-2 lg:col-span-1">
              <h2 class="text-2xl font-bold mb-4 text-green-600">My Books</h2>
              <div class="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-200">
                <For each={books()}>
                  {(book) => (
                    <div class="bg-white p-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
                      <p class="font-semibold text-lg text-green-600 mb-2">{book.title}</p>
                      <p class="text-gray-700 italic mb-2">by {book.author}</p>
                      <p class="text-sm text-gray-500 mb-2">Status: {book.status}</p>
                      <Show when={book.status !== 'Read'}>
                        <select
                          value={book.status}
                          onChange={(e) => updateBookStatus(book.id, e.target.value)}
                          class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent mt-2 box-border"
                        >
                          <option value="Want to Read">Want to Read</option>
                          <option value="Currently Reading">Currently Reading</option>
                          <option value="Read">Read</option>
                        </select>
                      </Show>
                      <Show when={book.status === 'Read'}>
                        <div class="mt-2">
                          <label class="block text-sm font-medium text-gray-700">Rating</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={book.rating || ''}
                            onInput={(e) => updateBookStatus(book.id, 'Read', e.target.value, book.review)}
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                          />
                          <label class="block text-sm font-medium text-gray-700 mt-2">Review</label>
                          <textarea
                            value={book.review || ''}
                            onInput={(e) => updateBookStatus(book.id, 'Read', book.rating, e.target.value)}
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                          />
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="col-span-1">
              <h2 class="text-2xl font-bold mb-4 text-green-600">Book Recommendations</h2>
              <button
                onClick={handleGetRecommendations}
                class={`w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading()}
              >
                {loading() ? 'Generating...' : 'Get Recommendations'}
              </button>
              <Show when={recommendations().length > 0}>
                <div class="mt-4 space-y-4">
                  <For each={recommendations()}>
                    {(rec) => (
                      <div class="bg-white p-4 rounded-lg shadow-md">
                        <p class="font-semibold text-lg text-green-600 mb-1">{rec.title}</p>
                        <p class="text-gray-700 italic mb-2">by {rec.author}</p>
                        <button
                          onClick={() => setNewBook({ title: rec.title, author: rec.author, status: 'Want to Read' })}
                          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out cursor-pointer"
                        >
                          Add to My Books
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </Show>

              <h2 class="text-2xl font-bold mb-4 text-green-600 mt-8">Reading Goals</h2>
              <form onSubmit={saveGoal} class="space-y-4">
                <input
                  type="number"
                  min="1"
                  placeholder="Set your annual reading goal"
                  value={goal()}
                  onInput={(e) => setGoal(e.target.value)}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                />
                <button
                  type="submit"
                  class={`w-full px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${goalLoading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={goalLoading()}
                >
                  {goalLoading() ? 'Saving...' : 'Set Goal'}
                </button>
              </form>

              <h2 class="text-2xl font-bold mb-4 text-green-600 mt-8">Reading Statistics</h2>
              <div class="bg-white p-4 rounded-lg shadow-md">
                <p class="text-lg">Total Books Read: {stats().totalBooks}</p>
                <p class="text-lg">Average Rating: {stats().averageRating.toFixed(2)}</p>
              </div>
              <Show when={stats().totalBooks > 0 && goal()}>
                <div class="mt-4">
                  <Doughnut
                    data={{
                      labels: ['Books Read', 'Remaining'],
                      datasets: [
                        {
                          data: [stats().totalBooks, goal() - stats().totalBooks],
                          backgroundColor: ['#10B981', '#E5E7EB']
                        }
                      ]
                    }}
                    options={{
                      plugins: {
                        legend: { position: 'bottom' },
                        title: { display: true, text: 'Reading Goal Progress' }
                      }
                    }}
                    width={400}
                    height={400}
                  />
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default App;
```