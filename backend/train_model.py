import os
import json
import re
import time
from tqdm import tqdm
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# Path configurations
TRAIN_PATH = "datasets/train-v1.1.json"
DEV_PATH = "datasets/dev-v1.1.json"

def clean_text(text):
    return text.lower().strip()

def split_into_sentences(text):
    """Simple sentence splitter using regex."""
    # Split on period, question mark, or exclamation mark followed by whitespace
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s', text)
    return [s.strip() for s in sentences if s.strip()]

def load_squad_data(filepath, limit_articles=10):
    """Parses SQuAD JSON file structure."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset file not found at: {filepath}")

    print(f"Loading {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        squad = json.load(f)

    samples = []
    # Limit number of articles parsed to keep demo training fast
    articles = squad["data"][:limit_articles]
    
    for article in tqdm(articles, desc="Parsing Articles"):
        for paragraph in article["paragraphs"]:
            context = paragraph["context"]
            sentences = split_into_sentences(context)
            
            for qa in paragraph["qas"]:
                question = qa["question"]
                answers = [ans["text"] for ans in qa["answers"]]
                
                # Create training sample candidates
                for sentence in sentences:
                    # Target label: 1 if any actual answer is in the sentence, else 0
                    label = 0
                    for answer in answers:
                        if answer.lower() in sentence.lower():
                            label = 1
                            break
                    
                    samples.append({
                        "context": context,
                        "question": question,
                        "sentence": sentence,
                        "label": label,
                        "answers": answers
                    })
                    
    return pd.DataFrame(samples)

def extract_features(df, vectorizer, is_train=True):
    """Extracts machine learning features for sentence retrieval."""
    print("Extracting features (TF-IDF vector representations)...")
    
    # 1. TF-IDF similarities
    if is_train:
        # Fit vectorizer on both questions and sentences
        corpus = pd.concat([df["sentence"], df["question"]]).unique()
        vectorizer.fit(corpus)

    q_tfidf = vectorizer.transform(df["question"])
    s_tfidf = vectorizer.transform(df["sentence"])
    
    # Compute cosine similarities (dot product since TF-IDF vectors are normalized)
    similarities = np.array([
        q_row.dot(s_row.T).toarray()[0][0] 
        for q_row, s_row in zip(q_tfidf, s_tfidf)
    ])
    
    # 2. Word overlap features
    overlaps = []
    for q, s in zip(df["question"], df["sentence"]):
        q_words = set(clean_text(q).split())
        s_words = set(clean_text(s).split())
        overlap = len(q_words.intersection(s_words)) / (len(q_words) + 1e-9)
        overlaps.append(overlap)
        
    overlaps = np.array(overlaps)
    
    # Assemble feature matrix X
    X = np.stack([similarities, overlaps], axis=1)
    y = df["label"].values
    
    return X, y

def main():
    print("=" * 60)
    print("SQuAD v1.1 QA Sentence Retrieval Model Trainer")
    print("=" * 60)
    
    # 1. Load data
    try:
        train_df = load_squad_data(TRAIN_PATH, limit_articles=25) # Fit on 25 articles for fast training
        dev_df = load_squad_data(DEV_PATH, limit_articles=5)     # Evaluate on 5 articles
    except Exception as e:
        print(f"\n[Error] Unable to load dataset: {e}")
        print("Please verify train-v1.1.json and dev-v1.1.json are located in the 'datasets/' directory.")
        return

    print(f"\nLoaded {len(train_df)} training candidates and {len(dev_df)} dev evaluation candidates.")

    # 2. Feature Extraction
    vectorizer = TfidfVectorizer(max_features=2500, stop_words='english')
    X_train, y_train = extract_features(train_df, vectorizer, is_train=True)
    X_dev, y_dev = extract_features(dev_df, vectorizer, is_train=False)

    # 3. Model Training
    print("\nFitting Logistic Regression Classifier on TF-IDF overlaps...")
    start_time = time.time()
    
    model = LogisticRegression(class_weight='balanced')
    model.fit(X_train, y_train)
    
    training_time = time.time() - start_time
    print(f"Training completed successfully in {training_time:.2f} seconds.")

    # 4. Predictions & Evaluation
    print("\nRunning evaluation on Dev partition...")
    y_pred = model.predict(X_dev)
    
    accuracy = accuracy_score(y_dev, y_pred)
    precision = precision_score(y_dev, y_pred)
    recall = recall_score(y_dev, y_pred)
    f1 = f1_score(y_dev, y_pred)
    
    # Print metrics table
    print("\n" + "=" * 45)
    print(f"{'Metric':<25} | {'Score':<15}")
    print("-" * 45)
    print(f"{'Exact Match Accuracy':<25} | {accuracy:.4f}")
    print(f"{'Precision (Contains Ans)':<25} | {precision:.4f}")
    print(f"{'Recall (Contains Ans)':<25} | {recall:.4f}")
    print(f"{'F1 Score':<25} | {f1:.4f}")
    print("=" * 45)

    # 5. Display sample predictions
    print("\nSample Predictions in Validation Set:")
    print("-" * 60)
    
    # Get positive samples where model predicted positive
    pos_samples = dev_df[y_pred == 1].head(3)
    
    if len(pos_samples) == 0:
        pos_samples = dev_df.head(3)
        
    for idx, (_, row) in enumerate(pos_samples.iterrows()):
        print(f"\n[Sample #{idx + 1}]")
        print(f"Question: {row['question']}")
        print(f"Gold Answer: {row['answers']}")
        print(f"Predicted Sentence containing Answer:\n   \"{row['sentence']}\"")
        print(f"Actual Match: {'SUCCESS' if row['label'] == 1 else 'FAILED'}")
        print("-" * 60)

if __name__ == "__main__":
    main()
