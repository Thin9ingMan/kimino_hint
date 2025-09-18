import "./Question.css"
const Question = () => {
    return(
        <>
            <h1>名前は何でしょう？</h1>
            <div className="question-container">
                <button>山田太郎</button>
                <button>西田太郎</button>
                <button>本田太郎</button>
                <button>海田太郎</button>
            </div>
            
        </>
    )
}

export default Question