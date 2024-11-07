"use client";

import { useState, FormEvent } from "react";
import Link from 'next/link';

export default function FactChecker() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [factCheckResults, setFactCheckResults] = useState<any[]>([]);
  const [articleContent, setArticleContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Function to call the extract claims API
  const extractClaims = async (content: string) => {
    const response = await fetch('/api/extractclaims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extract claims.');
    }
  
    const data = await response.json();
    return Array.isArray(data.claims) ? data.claims : JSON.parse(data.claims);
  };
  

  // Function to call the exasearch API for an individual claim
  const exaSearch = async (claim: string) => {
    const response = await fetch('/api/exasearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claim }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch verification for claim.');
    }

    const data = await response.json();
    return data.results;
  };

  // Function to call the verifyclaims API for an individual claim and sources
  const verifyClaim = async (claim: string, exasources: any) => {
    const formattedSources = JSON.stringify(exasources);
  
    console.log("Calling verifyClaim with formatted sources:", formattedSources);
  
    const response = await fetch('/api/verifyclaims', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claim, exasources: formattedSources }),
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify claim.');
    }
  
    const data = await response.json();
    console.log("VerifyClaim response for claim:", claim, data.claims);
    return data.claims;
  };
  

  // Updated factCheck function
  const factCheck = async (e: FormEvent) => {
    e.preventDefault();

    if (!articleContent) {
      setError("Please enter some content for fact-checking.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setFactCheckResults([]);

    try {
      // Extract claims from the article content
      const claims = await extractClaims(articleContent);

      // For each claim, fetch sources using exaSearch and then verify with verifyClaim
      const finalResults = await Promise.all(
        claims.map(async (claim: string) => {
          const exaSources = await exaSearch(claim);
          return await verifyClaim(claim, exaSources);
        })
      );

      // Set the results for all claims
      setFactCheckResults(finalResults);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setFactCheckResults([]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-col items-center justify-center flex-grow w-full max-w-4xl p-6 mx-auto">
      <div className="text-left">
        <h1 className="md:text-6xl text-4xl pb-5 font-medium opacity-0 animate-fade-up [animation-delay:200ms]">
            Fact Check Your
            <span className="text-brand-default"> Blogs & Articles </span>
            Instantly
        </h1>

        <p className="text-gray-800 mb-12 opacity-0 animate-fade-up [animation-delay:400ms]">
            We verify all your facts with real sources, so you can publish your blogs and articles with confidence.
        </p>
       </div>

        <form onSubmit={factCheck} className="space-y-6 w-full">
          <textarea
            value={articleContent}
            onChange={(e) => setArticleContent(e.target.value)}
            placeholder="Enter Your Blog or Article Content"
            className="w-full bg-white p-3 border box-border outline-none rounded-sm ring-2 ring-brand-default resize-none min-h-[150px] overflow-auto opacity-0 animate-fade-up [animation-delay:600ms]"
          />
          <button
            type="submit"
            className={`w-full bg-brand-default text-white font-semibold px-2 py-2 rounded-sm transition-opacity opacity-0 animate-fade-up [animation-delay:800ms] min-h-[50px] ring-2 ring-brand-default ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isGenerating}
          >
            {isGenerating ? 'Fact Checking...' : 'Fact Check Now'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {factCheckResults.length > 0 && (
          <div className="mt-20 w-full bg-white p-4 border outline-none resize-none min-h-[200px] overflow-auto rounded opacity-0 animate-fade-up [animation-delay:200ms]">
            {factCheckResults.map((result, index) => (
              <div key={index} className="mb-4">
                <h3 className="font-semibold">Claim: {result.claim}</h3>
                <p>Assessment: {result.assessment}</p>
                <p>Summary: {result.summary}</p>
                <p>Confidence Score: {result.confidence_score}</p>
                {/* <p>Sources: {result.sources.join(', ')}</p> */}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="w-full py-6 mt-auto">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-center text-gray-600">
            To report bugs or request new features, please message us{" "}
            <Link
              href="https://your-link.com" // Add your target link here
              target="_blank"
              className="underline font-bold"
            >
              here.
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}