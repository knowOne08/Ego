import React from "react";
import { Route, Routes} from "react-router-dom";
import withRouter from "../hooks/withRouter"
import { Home } from "../pages/home";
import { Portfolio } from "../pages/portfolio";
import { ContactUs } from "../pages/contact";
import { About } from "../pages/about";
import { Socialicons } from "../components/socialicons";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { ArtGallery } from "../pages/artGallery";
import { PoetryCollection } from "../pages/poetry";
import { PoetryCard } from "../pages/poetryCard";
import { ArtCard } from "../pages/artCard";
import { ProjectDetail } from "../pages/projectDetail";
import { Blog } from "../pages/blog";
import { BlogPost } from "../pages/blog/blogPost";
import AdminDashboard from "../pages/admin";
import BlogEditor from "../pages/admin/BlogEditor";

const AnimatedRoutes = withRouter(({ location }) => (
  <TransitionGroup>
    <CSSTransition
      key={location.key}
      timeout={{
        enter: 400,
        exit: 400,
      }}
      classNames="page"
      unmountOnExit
    >
      <Routes location={location}>
        <Route exact path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/project/:projectId" element={<ProjectDetail />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/art_gallery" element={<ArtGallery />}/>
        <Route path="/art_gallery/*" element={<ArtCard />}/>
        <Route path="/poetry" element={<PoetryCollection />} />
        <Route path="/poetry/*" element={<PoetryCard/>} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:blogId" element={<BlogPost />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/new" element={<BlogEditor />} />
        <Route path="/admin/edit/:id" element={<BlogEditor />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </CSSTransition>
  </TransitionGroup>
));

function AppRoutes() {
  return (
    <div className="s_c">
      <AnimatedRoutes />
      <Socialicons />
    </div>
  );
}

export default AppRoutes;
