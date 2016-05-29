

var Comment = React.createClass({
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  },

  render: function() {
    return (
      <div className="comment">
        <h2 className="commentAuthor">
          {this.props.author}
        </h2>
        <span dangerouslySetInnerHTML={this.rawMarkup()} />
      </div>
    );
  }
});

var CommentBox = React.createClass({
  loadCommentsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        if (data[this.props.repo[0]] !== undefined && data[this.props.repo[0]][this.props.repo[1]] !== undefined){
          this.setState({data: data[this.props.repo[0]][this.props.repo[1]]});
        } else {
          this.setState({data: []})
        }

      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleCommentSubmit: function(comment) {
    var comments = this.state.data;
    // Optimistically set an id on the new comment. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    comment.id = Date.now();
    var newComments = comments.concat([comment]);
    this.setState({data: newComments});
    $.ajax({
      url: this.props.url + '/' + this.props.repo[0] + '/' + this.props.repo[1],
      dataType: 'json',
      type: 'POST',
      data: comment,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: comments});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadCommentsFromServer();
    setInterval(this.loadCommentsFromServer, this.props.pollInterval);
  },
  render: function() {
    console.log(this.state.data);
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function(comment) {
      return (
        <Comment author={comment.author} key={comment.id}>
          {comment.text}
        </Comment>
      );
    });
    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onCommentSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" className="btn btn-default" />
      </form>
    );
  }
});

var RepoInformation = React.createClass({
  render: function(){

    return(
      <table className="table table-striped">
        <tbody>
          <tr>
            <td> <b> Author: </b> </td>
            <td> {this.props.repo[0]} </td>
          </tr>
          <tr>
            <td> <b> Repository Name: </b> </td>
            <td> {this.props.repo[1]} </td>
          </tr>
          <tr>
            <td> <b> No. of Open Issues: </b> </td>
            <td> {this.props.open === -1 ? '': this.props.open } </td>
          </tr>
          <tr>
            <td> <b> Issues Open in Last 24 hours: </b> </td>
            <td> {this.props.t1_open === -1 ? '': this.props.t1_open} </td>
          </tr>
          <tr>
            <td> <b> Issues Opened More than 7 days ago: </b> </td>
            <td> {this.props.t7_open === -1 ? '': this.props.t7_open} </td>
          </tr>
        </tbody>
      </table>
    );
  }
});


var GithubFetcher = React.createClass({
  getInitialState: function(){
    return {githubUrl: '', exist: false, githubParams: [], data: {}, open: -1,  t1_open: -1, t7_open: -1}
  },
  handleGithubUrlChange: function(e){
    this.setState({githubUrl: e.target.value});
  },
  handleSubmit: function(e){
    e.preventDefault();
    var githubUrl = this.state.githubUrl.trim().split('/');

    if(githubUrl.slice(-1)[0] === ""){
      githubUrl = githubUrl.slice(-3, -1);
    } else {
      githubUrl = githubUrl.slice(-2);
    }
    console.log(githubUrl);
    this.setState({githubParams: githubUrl});
    var baseUrl = 'https://api.github.com/repos/';
    var callingUrl =  baseUrl + githubUrl[0] + '/' + githubUrl[1];
    $.ajax({
      url: callingUrl,
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        this.setState({data: data, open: parseInt(data.open_issues), exist: true});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: {}, open: -1, exist: false });
        console.error(callingUrl, status, err.toString());

      }.bind(this)
    });
    var day = 1000*60*60*24;
    var now = new Date();
    var t24hoursAgo = Math.ceil(now.getTime() - day);
    t24hoursAgo = new Date(t24hoursAgo);
    t24hoursAgo = t24hoursAgo.toISOString();

    var callingUrl2 = callingUrl + '/issues?state=open&since=' + t24hoursAgo;
    $.ajax({
      url: callingUrl2,
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        this.setState({t1_open: data.length});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({t1_open: -1 });
        console.error(callingUrl2, status, err.toString());
      }.bind(this)
    });

    var d7ago = Math.ceil(now.getTime() - day);
    d7ago = new Date(d7ago);
    d7ago = d7ago.toISOString();
    var callingUrl3 = callingUrl + '/issues?state=open&since=' + d7ago;

    $.ajax({
      url: callingUrl2,
      dataType: 'json',
      type: 'GET',
      success: function(data) {
        this.setState({t7_open: this.state.open - data.length});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({t7_open: -1 });
        console.error(callingUrl3, status, err.toString());
      }.bind(this)
    });


  },
  render: function(){
    var repoExist, commentBox;
    if (!this.state.exist){
      repoExist = <div className="not-found panel panel-danger"> This Repository does not exist </div>;
    } else {
      commentBox = <CommentBox
        repo={this.state.githubParams}
        url="/api/comments"
        pollInterval={2000} />
    }

    return (
      <div>
        <h1 className="main-heading"> Github Issue Tracker</h1>
        <form className="form-inline" onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label for="githubUrl">Github Repository</label>
            <input
              type="url"
              className="form-control"
              placeholder="Any Github Url"
              size="140"
              value={this.state.githubUrl}
              onChange={this.handleGithubUrlChange}
              />
              </div>

          <button type="submit"className="btn btn-default">Get Info </button>
        </form>

        {repoExist}
        <RepoInformation
          repo={this.state.githubParams}
          open={this.state.open}
          t1_open={this.state.t1_open}
          t7_open={this.state.t7_open}
          exist={this.state.exist}
         />
         {commentBox}

      </div>

    );
  }
});

var App = React.createClass({
  render: function(){
    return (
    <div>
      <GithubFetcher />
    </div>
  );
  }

});

ReactDOM.render(
  <App/>,
  document.getElementById('content')
);
