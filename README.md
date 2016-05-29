

## Starting the App

```
git clone git@github.com:FalloutX/maxt-react.git maxt
cd maxt
npm install
node server.js
Then go to localhost:3000/
```

## Important Information

- __Tech stack__ used: React.js, express.js, node 6.1.0
- The main app is in `public/scripts/main.js` file.
- The App refers to `App` component in the the main App Component in `public/scripts/main.js` file.
- The components are designed in a tree structure.

```
Strucuture of the Application
              <App/>
                |
                |  
            <GithubFetcher />
                /            \
               /              \
  <Repo Infomation />    <CommentBox />
                            /      \
                          /         \
            <CommentForm/>          <CommentList />
                                           |
                                    <Comment />
```



## Future considerations
- Refactoring Components into thier own files [The Application at this stage is very small and doesn't require a lot of component files, for convienience]
- Adding proper backend for the Repository Comments.
- More Styling to make it look better.




## Changing the port

You can change the port number by setting the `$PORT` environment variable before invoking any of the scripts above, e.g.,

```sh
PORT=3001 node server.js
```
