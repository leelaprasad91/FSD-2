import "./App.css";
import { useState } from "react";

function App() {

  const [platform, setPlatform] = useState("Twitter");

  const [post, setPost] = useState("");
  const [drafts, setDrafts] = useState([]);
  let maxLength = 280;

if (platform === "LinkedIn") {
  maxLength = 3000;
} else if (platform === "Instagram") {
  maxLength = 2200;
}
function saveDraft() {

  if (post.trim() === "") {
    alert("Please write something first.");
    return;
  }

  setDrafts([...drafts, post]);

  setPost("");

}
function deleteDraft(indexToDelete){

    const updatedDrafts = drafts.filter(

        (draft,index)=> index!==indexToDelete

    );

    setDrafts(updatedDrafts);

}
function editDraft(index) {

    setPost(drafts[index]);

    deleteDraft(index);

}

  return (

    <div className="container">

      <h2>📢 Social Media Post Composer</h2>

      <label>Select Platform</label>

      <br />
      <br />

      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      >

        <option>Twitter</option>

        <option>LinkedIn</option>

        <option>Instagram</option>

      </select>

      <br />
      <br />

      <textarea

        rows="8"

        placeholder="Write your post..."

        value={post}
        
         maxLength={maxLength}
         
        onChange={(e) => setPost(e.target.value)}

      />

      <h3>

        Characters : {post.length}/{maxLength}

      </h3>

      <button onClick={saveDraft} disabled={post.length > maxLength}>

        Save Draft

      </button>
      <hr />

      <h2>Saved Drafts</h2>

      {
         drafts.length === 0 ?

         <p>No Drafts Yet</p>

         :

         drafts.map((draft,index)=>(

           <div key={index} className="draft">

             <h3>{draft}</h3>

             <button
                 className="edit"
                 onClick={() => editDraft(index)}
             >
                Edit
             </button>

             <button
                 className="delete"
                 onClick={() => deleteDraft(index)}
            >
                 Delete
             </button>

           </div>

       ))
    }

        

  

    </div>

  );

  

}

export default App;

