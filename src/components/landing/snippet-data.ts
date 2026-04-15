export type LandingSnippet = {
  lang: string;
  title: string;
  html: string;
};

export const LANDING_SNIPPETS: LandingSnippet[] = [
  {
    lang: "typescript",
    title: "useDebounce",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">function</span><span style="color:#B392F0"> useDebounce</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">&gt;(</span><span style="color:#FFAB70">value</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8">, </span><span style="color:#FFAB70">delay</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> number</span><span style="color:#E1E4E8">)</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8"> {</span>
<span style="color:#F97583">  const</span><span style="color:#E1E4E8"> [</span><span style="color:#79B8FF">debounced</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">setDebounced</span><span style="color:#E1E4E8">] </span><span style="color:#F97583">=</span><span style="color:#B392F0"> useState</span><span style="color:#E1E4E8">(value);</span>
<span style="color:#B392F0">  useEffect</span><span style="color:#E1E4E8">(() </span><span style="color:#F97583">=&gt;</span><span style="color:#E1E4E8"> {</span>
<span style="color:#F97583">    const</span><span style="color:#79B8FF"> t</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> setTimeout</span><span style="color:#E1E4E8">(() </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> setDebounced</span><span style="color:#E1E4E8">(value), delay);</span>
<span style="color:#F97583">    return</span><span style="color:#E1E4E8"> () </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> clearTimeout</span><span style="color:#E1E4E8">(t);</span>
<span style="color:#E1E4E8">  }, [value, delay]);</span>
<span style="color:#F97583">  return</span><span style="color:#E1E4E8"> debounced;</span>
<span style="color:#E1E4E8">}</span></code></pre>`,
  },
  {
    lang: "python",
    title: "retry decorator",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">def</span><span style="color:#B392F0"> retry</span><span style="color:#E1E4E8">(times</span><span style="color:#F97583">=</span><span style="color:#79B8FF">3</span><span style="color:#E1E4E8">, delay</span><span style="color:#F97583">=</span><span style="color:#79B8FF">1.0</span><span style="color:#E1E4E8">):</span>
<span style="color:#F97583">    def</span><span style="color:#B392F0"> decorator</span><span style="color:#E1E4E8">(fn):</span>
<span style="color:#B392F0">        @wraps</span><span style="color:#E1E4E8">(fn)</span>
<span style="color:#F97583">        def</span><span style="color:#B392F0"> wrapper</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">*</span><span style="color:#E1E4E8">args, </span><span style="color:#F97583">**</span><span style="color:#E1E4E8">kwargs):</span>
<span style="color:#F97583">            for</span><span style="color:#E1E4E8"> attempt </span><span style="color:#F97583">in</span><span style="color:#79B8FF"> range</span><span style="color:#E1E4E8">(times):</span>
<span style="color:#F97583">                try</span><span style="color:#E1E4E8">:</span>
<span style="color:#F97583">                    return</span><span style="color:#E1E4E8"> fn(</span><span style="color:#F97583">*</span><span style="color:#E1E4E8">args, </span><span style="color:#F97583">**</span><span style="color:#E1E4E8">kwargs)</span>
<span style="color:#F97583">                except</span><span style="color:#79B8FF"> Exception</span><span style="color:#F97583"> as</span><span style="color:#E1E4E8"> e:</span>
<span style="color:#F97583">                    if</span><span style="color:#E1E4E8"> attempt </span><span style="color:#F97583">==</span><span style="color:#E1E4E8"> times </span><span style="color:#F97583">-</span><span style="color:#79B8FF"> 1</span><span style="color:#E1E4E8">:</span>
<span style="color:#F97583">                        raise</span>
<span style="color:#E1E4E8">                    time.sleep(delay </span><span style="color:#F97583">*</span><span style="color:#E1E4E8"> (</span><span style="color:#79B8FF">2</span><span style="color:#F97583"> **</span><span style="color:#E1E4E8"> attempt))</span>
<span style="color:#F97583">        return</span><span style="color:#E1E4E8"> wrapper</span>
<span style="color:#F97583">    return</span><span style="color:#E1E4E8"> decorator</span></code></pre>`,
  },
  {
    lang: "rust",
    title: "require_env",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">fn</span><span style="color:#B392F0"> require_env</span><span style="color:#E1E4E8">(key</span><span style="color:#F97583">: &amp;</span><span style="color:#B392F0">str</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> anyhow</span><span style="color:#F97583">::</span><span style="color:#B392F0">Result</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">String</span><span style="color:#E1E4E8">&gt; {</span>
<span style="color:#B392F0">    std</span><span style="color:#F97583">::</span><span style="color:#B392F0">env</span><span style="color:#F97583">::</span><span style="color:#B392F0">var</span><span style="color:#E1E4E8">(key)</span><span style="color:#F97583">.</span><span style="color:#B392F0">map_err</span><span style="color:#E1E4E8">(|_| {</span>
<span style="color:#B392F0">        anyhow</span><span style="color:#F97583">::</span><span style="color:#B392F0">anyhow!</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">"missing env var: {}"</span><span style="color:#E1E4E8">, key)</span>
<span style="color:#E1E4E8">    })</span>
<span style="color:#E1E4E8">}</span></code></pre>`,
  },
  {
    lang: "sql",
    title: "active users",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">SELECT</span>
<span style="color:#79B8FF">  u</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">id</span><span style="color:#E1E4E8">,</span>
<span style="color:#79B8FF">  u</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">email</span><span style="color:#E1E4E8">,</span>
<span style="color:#79B8FF">  COUNT</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">e</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">id</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">AS</span><span style="color:#E1E4E8"> event_count</span>
<span style="color:#F97583">FROM</span><span style="color:#E1E4E8"> users u</span>
<span style="color:#F97583">LEFT JOIN</span><span style="color:#E1E4E8"> events e</span>
<span style="color:#F97583">  ON</span><span style="color:#79B8FF"> e</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">user_id</span><span style="color:#F97583"> =</span><span style="color:#79B8FF"> u</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">id</span>
<span style="color:#F97583">  AND</span><span style="color:#79B8FF"> e</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">created_at</span><span style="color:#F97583"> &gt;</span><span style="color:#F97583"> NOW</span><span style="color:#E1E4E8">() </span><span style="color:#F97583">-</span><span style="color:#E1E4E8"> INTERVAL </span><span style="color:#9ECBFF">'30 days'</span>
<span style="color:#F97583">GROUP BY</span><span style="color:#79B8FF"> u</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">id</span>
<span style="color:#F97583">ORDER BY</span><span style="color:#E1E4E8"> event_count </span><span style="color:#F97583">DESC</span>
<span style="color:#F97583">LIMIT</span><span style="color:#79B8FF"> 50</span><span style="color:#E1E4E8">;</span></code></pre>`,
  },
  {
    lang: "typescript",
    title: "cn utility",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">import</span><span style="color:#E1E4E8"> { clsx, </span><span style="color:#F97583">type</span><span style="color:#E1E4E8"> ClassValue } </span><span style="color:#F97583">from</span><span style="color:#9ECBFF"> 'clsx'</span><span style="color:#E1E4E8">;</span>
<span style="color:#F97583">import</span><span style="color:#E1E4E8"> { twMerge } </span><span style="color:#F97583">from</span><span style="color:#9ECBFF"> 'tailwind-merge'</span><span style="color:#E1E4E8">;</span>

<span style="color:#F97583">export</span><span style="color:#F97583"> function</span><span style="color:#B392F0"> cn</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">...</span><span style="color:#FFAB70">inputs</span><span style="color:#F97583">:</span><span style="color:#B392F0"> ClassValue</span><span style="color:#E1E4E8">[]) {</span>
<span style="color:#F97583">  return</span><span style="color:#B392F0"> twMerge</span><span style="color:#E1E4E8">(</span><span style="color:#B392F0">clsx</span><span style="color:#E1E4E8">(inputs));</span>
<span style="color:#E1E4E8">}</span></code></pre>`,
  },
  {
    lang: "bash",
    title: "git aliases",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">alias</span><span style="color:#E1E4E8"> gs</span><span style="color:#F97583">=</span><span style="color:#9ECBFF">'git status -sb'</span>
<span style="color:#F97583">alias</span><span style="color:#E1E4E8"> gl</span><span style="color:#F97583">=</span><span style="color:#9ECBFF">'git log --oneline --graph --decorate -20'</span>
<span style="color:#F97583">alias</span><span style="color:#E1E4E8"> gco</span><span style="color:#F97583">=</span><span style="color:#9ECBFF">'git checkout'</span>
<span style="color:#F97583">alias</span><span style="color:#E1E4E8"> gap</span><span style="color:#F97583">=</span><span style="color:#9ECBFF">'git add -p'</span>
<span style="color:#F97583">alias</span><span style="color:#E1E4E8"> gri</span><span style="color:#F97583">=</span><span style="color:#9ECBFF">'git rebase -i HEAD~'</span></code></pre>`,
  },
  {
    lang: "typescript",
    title: "paginate",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">async</span><span style="color:#F97583"> function</span><span style="color:#B392F0"> paginate</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">&gt;(</span>
<span style="color:#B392F0">  fetcher</span><span style="color:#F97583">:</span><span style="color:#E1E4E8"> (</span><span style="color:#FFAB70">cursor</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> string</span><span style="color:#F97583"> |</span><span style="color:#79B8FF"> null</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> Promise</span><span style="color:#E1E4E8">&lt;{</span>
<span style="color:#FFAB70">    items</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8">[];</span>
<span style="color:#FFAB70">    next</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> string</span><span style="color:#F97583"> |</span><span style="color:#79B8FF"> null</span><span style="color:#E1E4E8">;</span>
<span style="color:#E1E4E8">  }&gt;,</span>
<span style="color:#E1E4E8">)</span><span style="color:#F97583">:</span><span style="color:#B392F0"> Promise</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">[]&gt; {</span>
<span style="color:#F97583">  const</span><span style="color:#79B8FF"> all</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8">[] </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> [];</span>
<span style="color:#F97583">  let</span><span style="color:#E1E4E8"> cursor</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> string</span><span style="color:#F97583"> |</span><span style="color:#79B8FF"> null</span><span style="color:#F97583"> =</span><span style="color:#79B8FF"> null</span><span style="color:#E1E4E8">;</span>
<span style="color:#F97583">  do</span><span style="color:#E1E4E8"> {</span>
<span style="color:#F97583">    const</span><span style="color:#E1E4E8"> { </span><span style="color:#79B8FF">items</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">next</span><span style="color:#E1E4E8"> } </span><span style="color:#F97583">=</span><span style="color:#F97583"> await</span><span style="color:#B392F0"> fetcher</span><span style="color:#E1E4E8">(cursor);</span>
<span style="color:#E1E4E8">    all.</span><span style="color:#B392F0">push</span><span style="color:#E1E4E8">(</span><span style="color:#F97583">...</span><span style="color:#E1E4E8">items);</span>
<span style="color:#E1E4E8">    cursor </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> next;</span>
<span style="color:#E1E4E8">  } </span><span style="color:#F97583">while</span><span style="color:#E1E4E8"> (cursor);</span>
<span style="color:#F97583">  return</span><span style="color:#E1E4E8"> all;</span>
<span style="color:#E1E4E8">}</span></code></pre>`,
  },
  {
    lang: "python",
    title: "chunk",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">def</span><span style="color:#B392F0"> chunk</span><span style="color:#E1E4E8">(lst: </span><span style="color:#79B8FF">list</span><span style="color:#E1E4E8">, size: </span><span style="color:#79B8FF">int</span><span style="color:#E1E4E8">):</span>
<span style="color:#9ECBFF">    """Yield successive n-sized chunks."""</span>
<span style="color:#F97583">    for</span><span style="color:#E1E4E8"> i </span><span style="color:#F97583">in</span><span style="color:#79B8FF"> range</span><span style="color:#E1E4E8">(</span><span style="color:#79B8FF">0</span><span style="color:#E1E4E8">, </span><span style="color:#79B8FF">len</span><span style="color:#E1E4E8">(lst), size):</span>
<span style="color:#F97583">        yield</span><span style="color:#E1E4E8"> lst[i : i </span><span style="color:#F97583">+</span><span style="color:#E1E4E8"> size]</span></code></pre>`,
  },
  {
    lang: "typescript",
    title: "sleep",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">const</span><span style="color:#B392F0"> sleep</span><span style="color:#F97583"> =</span><span style="color:#E1E4E8"> (</span><span style="color:#FFAB70">ms</span><span style="color:#F97583">:</span><span style="color:#79B8FF"> number</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">=&gt;</span>
<span style="color:#F97583">  new</span><span style="color:#79B8FF"> Promise</span><span style="color:#E1E4E8">&lt;</span><span style="color:#79B8FF">void</span><span style="color:#E1E4E8">&gt;((</span><span style="color:#FFAB70">resolve</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">=&gt;</span>
<span style="color:#B392F0">    setTimeout</span><span style="color:#E1E4E8">(resolve, ms)</span>
<span style="color:#E1E4E8">  );</span></code></pre>`,
  },
  {
    lang: "sql",
    title: "upsert user",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">INSERT INTO</span><span style="color:#E1E4E8"> users (id, email, updated_at)</span>
<span style="color:#F97583">VALUES</span><span style="color:#E1E4E8"> ($</span><span style="color:#79B8FF">1</span><span style="color:#E1E4E8">, $</span><span style="color:#79B8FF">2</span><span style="color:#E1E4E8">, </span><span style="color:#F97583">NOW</span><span style="color:#E1E4E8">())</span>
<span style="color:#F97583">ON CONFLICT</span><span style="color:#E1E4E8"> (id) </span><span style="color:#F97583">DO UPDATE</span>
<span style="color:#F97583">  SET</span><span style="color:#E1E4E8"> email </span><span style="color:#F97583">=</span><span style="color:#79B8FF"> EXCLUDED</span><span style="color:#E1E4E8">.</span><span style="color:#79B8FF">email</span><span style="color:#E1E4E8">,</span>
<span style="color:#E1E4E8">      updated_at </span><span style="color:#F97583">=</span><span style="color:#F97583"> NOW</span><span style="color:#E1E4E8">()</span>
<span style="color:#F97583">RETURNING</span><span style="color:#F97583"> *</span><span style="color:#E1E4E8">;</span></code></pre>`,
  },
  {
    lang: "rust",
    title: "read_lines",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">use</span><span style="color:#B392F0"> std</span><span style="color:#F97583">::</span><span style="color:#B392F0">io</span><span style="color:#F97583">::</span><span style="color:#E1E4E8">{</span><span style="color:#79B8FF">self</span><span style="color:#E1E4E8">, </span><span style="color:#B392F0">BufRead</span><span style="color:#E1E4E8">};</span>

<span style="color:#F97583">fn</span><span style="color:#B392F0"> read_lines</span><span style="color:#E1E4E8">(path</span><span style="color:#F97583">: &amp;</span><span style="color:#B392F0">str</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">-&gt;</span><span style="color:#B392F0"> io</span><span style="color:#F97583">::</span><span style="color:#B392F0">Result</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">Vec</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">String</span><span style="color:#E1E4E8">&gt;&gt; {</span>
<span style="color:#F97583">    let</span><span style="color:#E1E4E8"> file </span><span style="color:#F97583">=</span><span style="color:#B392F0"> std</span><span style="color:#F97583">::</span><span style="color:#B392F0">fs</span><span style="color:#F97583">::</span><span style="color:#B392F0">File</span><span style="color:#F97583">::</span><span style="color:#B392F0">open</span><span style="color:#E1E4E8">(path)</span><span style="color:#F97583">?</span><span style="color:#E1E4E8">;</span>
<span style="color:#B392F0">    io</span><span style="color:#F97583">::</span><span style="color:#B392F0">BufReader</span><span style="color:#F97583">::</span><span style="color:#B392F0">new</span><span style="color:#E1E4E8">(file)</span>
<span style="color:#F97583">        .</span><span style="color:#B392F0">lines</span><span style="color:#E1E4E8">()</span>
<span style="color:#F97583">        .</span><span style="color:#B392F0">collect</span><span style="color:#E1E4E8">()</span>
<span style="color:#E1E4E8">}</span></code></pre>`,
  },
  {
    lang: "typescript",
    title: "groupBy",
    html: `<pre style="background:transparent;margin:0;padding:0;font-size:9.5px;line-height:1.55;font-family:ui-monospace,'Geist Mono',monospace"><code><span style="color:#F97583">function</span><span style="color:#B392F0"> groupBy</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">, </span><span style="color:#B392F0">K</span><span style="color:#F97583"> extends</span><span style="color:#B392F0"> PropertyKey</span><span style="color:#E1E4E8">&gt;(</span>
<span style="color:#FFAB70">  items</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8">[],</span>
<span style="color:#B392F0">  key</span><span style="color:#F97583">:</span><span style="color:#E1E4E8"> (</span><span style="color:#FFAB70">item</span><span style="color:#F97583">:</span><span style="color:#B392F0"> T</span><span style="color:#E1E4E8">) </span><span style="color:#F97583">=&gt;</span><span style="color:#B392F0"> K</span><span style="color:#E1E4E8">,</span>
<span style="color:#E1E4E8">)</span><span style="color:#F97583">:</span><span style="color:#B392F0"> Record</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">K</span><span style="color:#E1E4E8">, </span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">[]&gt; {</span>
<span style="color:#F97583">  return</span><span style="color:#E1E4E8"> items.</span><span style="color:#B392F0">reduce</span><span style="color:#E1E4E8">((acc, item) </span><span style="color:#F97583">=&gt;</span><span style="color:#E1E4E8"> {</span>
<span style="color:#F97583">    const</span><span style="color:#79B8FF"> k</span><span style="color:#F97583"> =</span><span style="color:#B392F0"> key</span><span style="color:#E1E4E8">(item);</span>
<span style="color:#E1E4E8">    (acc[k] </span><span style="color:#F97583">??=</span><span style="color:#E1E4E8"> []).</span><span style="color:#B392F0">push</span><span style="color:#E1E4E8">(item);</span>
<span style="color:#F97583">    return</span><span style="color:#E1E4E8"> acc;</span>
<span style="color:#E1E4E8">  }, {} </span><span style="color:#F97583">as</span><span style="color:#B392F0"> Record</span><span style="color:#E1E4E8">&lt;</span><span style="color:#B392F0">K</span><span style="color:#E1E4E8">, </span><span style="color:#B392F0">T</span><span style="color:#E1E4E8">[]&gt;);</span>
<span style="color:#E1E4E8">}</span></code></pre>`,
  },
];
