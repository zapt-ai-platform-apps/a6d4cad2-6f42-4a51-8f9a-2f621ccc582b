import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { createEvent, supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-solid';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Chart, Bar } from 'solid-chartjs';
import 'chart.js/auto';

function App() {
  const [books, setBooks] = createSignal([]);
  const [newBook, setNewBook] = createSignal({ title: '', author: '', coverImageUrl: '', status: 'Want to Read' });
  const [user, setUser] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal('login');
  const [loading, setLoading] = createSignal(false);
  const [recommendations, setRecommendations] = createSignal([]);
  const [goal, setGoal] = createSignal({ year: new Date().getFullYear(), target: 0 });
  const [stats, setStats] = createSignal({});
  const [recommendationLoading, setRecommendationLoading] = createSignal(false);

  const checkUserSignedIn = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setCurrentPage('homePage');
    }
  };

  onMount(checkUserSignedIn);

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
      authListener.subscription.unsubscribe();
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook()),
      });
      if (response.ok) {
        const savedBook = await response.json();
        setBooks([...books(), savedBook]);
        setNewBook({ title: '', author: '', coverImageUrl: '', status: 'Want to Read' });
      } else {
        console.error('Error saving book');
      }
    } catch (error) {
      console.error('Error saving book:', error);
    }
    setLoading(false);
  };

  const updateBookStatus = async (bookId, status, rating = null, review = null) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/updateBookStatus', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: bookId, status, rating, review }),
      });
      if (response.ok) {
        setBooks(books().map(book => book.id === bookId ? { ...book, status, rating, review } : book));
      } else {
        console.error('Error updating book status');
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    }
    setLoading(false);
    fetchStats();
  };

  const fetchStats = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/getStats', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      setStats(data);
    } else {
      console.error('Error fetching stats:', response.statusText);
    }
    setLoading(false);
  };

  const saveGoal = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await fetch('/api/saveGoal', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goal()),
      });
      if (response.ok) {
        console.log('Goal saved successfully');
      } else {
        console.error('Error saving goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
    setLoading(false);
    fetchStats();
  };

  const handleGenerateRecommendations = async () => {
    setRecommendationLoading(true);
    try {
      const readBooks = books().filter(book => book.status === 'Read').map(book => book.title).join(', ');
      const prompt = `Based on the following books I've read and liked: ${readBooks}, recommend me 5 books in JSON format with the structure: { "recommendations": [ { "title": "", "author": "", "coverImageUrl": "" } ] }`;
      const result = await createEvent('chatgpt_request', {
        prompt,
        response_type: 'json'
      });
      if (result && result.recommendations) {
        setRecommendations(result.recommendations);
      } else {
        console.error('Error generating recommendations');
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
    setRecommendationLoading(false);
  };

  createEffect(() => {
    if (!user()) return;
    fetchBooks();
    fetchStats();
  });

  const chartData = {
    labels: ['Books Read', 'Goal'],
    datasets: [
      {
        label: 'Reading Progress',
        data: [stats().totalBooks || 0, stats().goal || 0],
        backgroundColor: ['#34D399', '#60A5FA'],
      },
    ],
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 text-gray-800">
      <Show
        when={currentPage() === 'homePage'}
        fallback={
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
        }
      >
        <div class="max-w-7xl mx-auto p-4 h-full">
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
                <input
                  type="text"
                  placeholder="Cover Image URL"
                  value={newBook().coverImageUrl}
                  onInput={(e) => setNewBook({ ...newBook(), coverImageUrl: e.target.value })}
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
                  <Show when={loading()}>Saving...</Show>
                  <Show when={!loading()}>Save Book</Show>
                </button>
              </form>
            </div>

            <div class="col-span-1 md:col-span-2">
              <h2 class="text-2xl font-bold mb-4 text-green-600">Your Books</h2>
              <div class="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-green-200">
                <Show when={!loading()} fallback={<p>Loading books...</p>}>
                  <For each={books()}>
                    {(book) => (
                      <div class="bg-white p-6 rounded-lg shadow-md flex items-start space-x-4 transition duration-300 ease-in-out transform hover:scale-105">
                        <img src={book.coverImageUrl} alt={book.title} class="w-24 h-32 object-cover rounded-lg" />
                        <div class="flex-1">
                          <h3 class="font-semibold text-xl text-green-600 mb-1">{book.title}</h3>
                          <p class="text-gray-700 mb-2">{book.author}</p>
                          <select
                            value={book.status}
                            onChange={(e) => updateBookStatus(book.id, e.target.value, book.rating, book.review)}
                            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                          >
                            <option value="Want to Read">Want to Read</option>
                            <option value="Currently Reading">Currently Reading</option>
                            <option value="Read">Read</option>
                          </select>
                          <Show when={book.status === 'Read'}>
                            <div class="mt-2 space-y-2">
                              <input
                                type="number"
                                min="1"
                                max="5"
                                value={book.rating || ''}
                                onInput={(e) => updateBookStatus(book.id, book.status, parseInt(e.target.value), book.review)}
                                class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                                placeholder="Rating (1-5)"
                              />
                              <textarea
                                value={book.review || ''}
                                onInput={(e) => updateBookStatus(book.id, book.status, book.rating, e.target.value)}
                                class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                                placeholder="Write a review"
                              />
                            </div>
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </div>
            </div>
          </div>

          <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 class="text-2xl font-bold mb-4 text-green-600">Reading Goals</h2>
              <div class="bg-white p-6 rounded-lg shadow-md">
                <input
                  type="number"
                  min="1"
                  value={goal().target || ''}
                  onInput={(e) => setGoal({ ...goal(), target: parseInt(e.target.value) })}
                  class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent box-border"
                  placeholder="Set your goal (number of books)"
                />
                <button
                  onClick={saveGoal}
                  class={`w-full mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading()}
                >
                  <Show when={loading()}>Saving...</Show>
                  <Show when={!loading()}>Set Goal</Show>
                </button>
              </div>
              <Show when={stats().goal}>
                <div class="mt-4 bg-white p-6 rounded-lg shadow-md">
                  <h3 class="font-semibold text-xl text-green-600 mb-2">Progress</h3>
                  <p>You have read {stats().totalBooks} out of {stats().goal} books.</p>
                  <div class="mt-4">
                    <Bar data={chartData} />
                  </div>
                </div>
              </Show>
            </div>

            <div>
              <h2 class="text-2xl font-bold mb-4 text-green-600">Statistics</h2>
              <div class="bg-white p-6 rounded-lg shadow-md">
                <Show when={!loading()}>
                  <p>Total Books Read: {stats().totalBooks || 0}</p>
                  <p>Average Rating: {stats().averageRating ? stats().averageRating.toFixed(2) : 'N/A'}</p>
                </Show>
                <Show when={loading()}>
                  <p>Loading statistics...</p>
                </Show>
              </div>
            </div>
          </div>

          <div class="mt-8">
            <h2 class="text-2xl font-bold mb-4 text-green-600">Book Recommendations</h2>
            <button
              onClick={handleGenerateRecommendations}
              class={`px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${recommendationLoading() ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={recommendationLoading()}
            >
              <Show when={recommendationLoading()}>Generating...</Show>
              <Show when={!recommendationLoading()}>Get Recommendations</Show>
            </button>
            <Show when={recommendations().length > 0}>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                <For each={recommendations()}>
                  {(rec) => (
                    <div class="bg-white p-6 rounded-lg shadow-md flex flex-col items-center transition duration-300 ease-in-out transform hover:scale-105">
                      <img src={rec.coverImageUrl} alt={rec.title} class="w-32 h-48 object-cover rounded-lg mb-4" />
                      <h3 class="font-semibold text-xl text-green-600 mb-1 text-center">{rec.title}</h3>
                      <p class="text-gray-700 mb-2 text-center">{rec.author}</p>
                      <button
                        onClick={() => {
                          setNewBook({
                            title: rec.title,
                            author: rec.author,
                            coverImageUrl: rec.coverImageUrl,
                            status: 'Want to Read',
                          });
                          saveBook(new Event('submit'));
                        }}
                        class={`mt-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${loading() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading()}
                      >
                        <Show when={loading()}>Adding...</Show>
                        <Show when={!loading()}>Add to My Books</Show>
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default App;