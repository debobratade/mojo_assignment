import React, { useEffect, useState } from 'react';
import './App.css';
import facebookLogo from './facebook-logo.png'; 

const App = () => {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [insights, setInsights] = useState([]);

  const responseFacebook = (response) => {
    console.warn(response);
    setUser(response);
    fetchPages(response.accessToken);
  };

  const fetchPages = (accessToken) => {
    const url = `https://graph.facebook.com/v12.0/me/accounts?access_token=${accessToken}`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data && !data.error) {
          setPages(data.data);
        } else {
          console.error('Error fetching pages:', data.error);
        }
      })
      .catch((error) => {
        console.error('Error fetching pages:', error);
      });
  };

  const fetchPageInsights = (pageId, accessToken) => {
    const since = '2024-06-21';
    const until = '2024-07-02';
    const metrics = 'page_impressions';
    const url = `https://graph.facebook.com/v12.0/${pageId}/insights?metric=${metrics}&since=${since}&until=${until}&period=day&access_token=${accessToken}`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setInsights(data.data || []);
      })
      .catch((error) => {
        console.error('Error fetching page insights:', error);
      });
  };

  const handlePageSelect = (event) => {
    const pageId = event.target.value;
    setSelectedPage(pageId);
    fetchPageInsights(pageId, user.accessToken);
  };

  const handleLogout = () => {
    setUser(null);
    setPages([]);
    setSelectedPage(null);
    setInsights([]);
  };

  const handleLogin = () => {
    const clientId = '981366727005421';
    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    const authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=public_profile,email,pages_show_list`;

    window.location.href = authUrl;
  };

  const handleAuthResponse = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      const clientId = '981366727005421';
      const clientSecret = '9baa2994d700606a58685d78f03f8e05';
      const redirectUri = `${window.location.origin}/auth/facebook/callback`;

      const tokenUrl = `https://graph.facebook.com/v12.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`;

      fetch(tokenUrl)
        .then((response) => response.json())
        .then((data) => {
          if (data.access_token) {
            const userUrl = `https://graph.facebook.com/v12.0/me?fields=id,name,email,picture&access_token=${data.access_token}`;
            fetch(userUrl)
              .then((response) => response.json())
              .then((userData) => {
                responseFacebook({ ...userData, accessToken: data.access_token });
              })
              .catch((error) => {
                console.error('Error fetching user data:', error);
              });
          } else {
            console.error('Error fetching access token:', data.error);
          }
        })
        .catch((error) => {
          console.error('Error fetching access token:', error);
        });
    }
  };

  useEffect(() => {
    handleAuthResponse();
  }, []);

  return (
    <div className="App">
      <div className="centered-container">
        <h1>Facebook Login</h1>
        {!user ? (
          <button className="fb-login-button" onClick={handleLogin}>
            <img src={facebookLogo} alt="Facebook logo" />
            Login with Facebook
          </button>
        ) : (
          <button onClick={handleLogout}>Logout</button>
        )}
        {user && (
          <div>
            <h2>Welcome, {user.name}</h2>
            <img src={user.picture.data.url} alt={user.name} />
          </div>
        )}
        {pages.length > 0 && (
          <div>
            <h3>Your Pages</h3>
            <select onChange={handlePageSelect}>
              <option value="">Select a page</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {selectedPage && (
          <div>
            <h3>Page Insights</h3>
            {insights.length > 0 ? (
              <div>
                {insights.map((insight, index) => (
                  <div key={index}>
                    <strong>{insight.title}: </strong>
                    {insight.values[0].value}
                  </div>
                ))}
              </div>
            ) : (
              <p>No insights data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
