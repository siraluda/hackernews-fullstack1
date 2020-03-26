import React, { Component } from 'react'
import Link from './Link'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'


export const FEED_QUERY = gql`
  {
    feed {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`


class LinkList extends Component {
  render() {
    return (
        <Query query={FEED_QUERY}>
           {({ loading, error, data, subscribeToMore }) => {
                if (loading) return <div>Fetching</div>
                if (error) return <div>Error</div>

                this._subscribeToNewLinks(subscribeToMore)
                this._subscribeToNewVotes(subscribeToMore)
    
                const linksToRender = data.feed.links
    
                return (
                    <div>
                    {linksToRender.map((link, index) => 
                      <Link 
                        key={ link.id } 
                        link={ link } 
                        index={ index } 
                        updateStoreAfterVote={ this._updateCacheAfterVote }
                      />)}
                    </div>
                )
            }}
        </Query>
      )  
  }


  _updateCacheAfterVote = (store, createVote, linkId) => {
    // 1. reading the current state of the cached data for the FEED_QUERY from the store.
    const data = store.readQuery({ query: FEED_QUERY })
    
    // 2. retrieving the link that the user just voted for from that list.
    const votedLink = data.feed.links.find(link => link.id === linkId)
    // 3. resetting its votes to the votes that were just returned by the server
    votedLink.votes = createVote.link.votes
    
    // 4. write the modified data back into the store.
    store.writeQuery({ query: FEED_QUERY, data })
  }

  _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        //  All you’re doing inside updateQuery is retrieving the new link from the received subscriptionData, 
        // merging it into the existing list of links and returning the result of this operation.
        
        if (!subscriptionData.data) return prev
        const newLink = subscriptionData.data.newLink
        const exists = prev.feed.links.find(({ id }) => id === newLink.id);
        if (exists) return prev;
  
        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename
          }
        })
      }
    })
  }

  _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION
    })
  }  
  
  
}

export default LinkList
