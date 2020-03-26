import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import { BrowserRouter } from 'react-router-dom'
import { AUTH_TOKEN } from './components/constants';

// 1 importing the required dependencies from the installed packages (apollo-boost, react-apollo, graphql)
import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import { InMemoryCache } from "apollo-cache-inmemory"
import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'


// 2  create the httpLink that will connect your ApolloClient instance with the GraphQL API, your GraphQL server will be running on http://localhost:4000
const httpLink = createHttpLink({
  uri: 'http://localhost:4000'
})

// this Http-link middleware lets you modify requests before they are sent to the server. [Http-Link]
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AUTH_TOKEN) // AUTH_TOKEN is the key we need to retrieve the JWT token from local storage
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

//  create a new WebSocketLink that represents the WebSocket connection. [Websocket-Link middleware]
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000`,
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem(AUTH_TOKEN),
    }
  }
})

/** split() is used for proper “routing” of the requests to a specific middleware link 
 *  split takes 3 args i.e a Test and 2 ApolloLinks [Http-link] & [Websocket-link]). If the Test
 *  returns true the request will be fired tothe link in the 2nd argument, if false the 3rd argument.
*/
const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  authLink.concat(httpLink)
)

//3 instantiate ApolloClient by passing in the httpLink and a new instance of an InMemoryCache
const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
})

//4 render the root component of your React app. The App is wrapped with the higher-order component ApolloProvider that gets passed the client as a prop
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={ client }>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
