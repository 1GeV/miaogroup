# Homepage Diagram Replacement

Replace the existing `.hero-diagram` block in `src/pages/index.astro` with:

```astro
<div class="hero-diagram" aria-hidden="true">
  <div class="diagram-label">AdS / CFT</div>
  <div class="diagram-field">
    <div class="diagram-boundary"></div>
    <div class="diagram-bulk"></div>
    <div class="diagram-geodesic geodesic-one"></div>
    <div class="diagram-geodesic geodesic-two"></div>
    <span class="diagram-marker marker-one"></span>
    <span class="diagram-marker marker-two"></span>
  </div>
  <span class="formula formula-correspondence"><i>Z</i><sub>CFT</sub> = <i>Z</i><sub>AdS</sub></span>
  <span class="diagram-caption">boundary &harr; bulk</span>
</div>
```

Append this CSS to `src/styles/global.css`:

```css
.diagram-field { position:absolute; inset:42px 4px 52px; }
.diagram-boundary { position:absolute; width:300px; height:300px; left:65px; top:0; border:1px solid #a9bfce; border-radius:50%; }
.diagram-bulk { position:absolute; width:400px; height:148px; left:0; top:102px; border:1px solid #a9bfce; border-radius:50%; transform:rotate(-24deg); }
.diagram-geodesic { position:absolute; border-top:1px solid #7195ae; transform-origin:left center; }
.geodesic-one { width:205px; left:102px; top:150px; transform:rotate(-36deg); }
.geodesic-two { width:168px; left:157px; top:183px; transform:rotate(27deg); }
.diagram-marker { position:absolute; width:7px; height:7px; border-radius:50%; background:var(--teal); }
.marker-one { left:98px; top:148px; }.marker-two { left:304px; top:27px; }
.formula-correspondence { left:20px; top:82px; }.formula-correspondence i { font-style:italic; }.formula-correspondence sub { font-size:.68em; font-style:normal; }
.diagram-caption { position:absolute; right:18px; bottom:31px; color:var(--muted); font-family:var(--serif); font-size:13px; font-style:italic; }
```

Use `onlineMeeting` as a plain optional string in both content schemas. It can contain a Zoom URL, Zoom meeting ID, Tencent Meeting code, or access instructions. Render it as ordinary metadata, never as an action button.
