

    const riveAnimation = new rive.Rive({
        src: "https://nickhirche.github.io/tt-wf/files/comments.riv",
        // OR the path to a discoverable and public Rive asset
        // src: '/public/example.riv',
        canvas: document.getElementById("canvas"),
        autoplay: true,
        artboard: 'comments-animation',
        animations: 'CommentsTimeline', // Name der Animation aus der Rive-Datei
        loop: true,
        onLoad: () => {
          riveAnimation.resizeDrawingSurfaceToCanvas();
        },
    });



    document.addEventListener("DOMContentLoaded", () => {
      // Erstelle eine neue Rive-Instanz
      const riveAnimation = new Rive({
        src: "https://nickhirche.github.io/tt-wf/files/comments.riv",
        canvas: document.getElementById("canvas"),
        autoplay: false,
        artboard: 'comments-animation',
        animations: 'CommentsTimeline', // Name der Animation aus der Rive-Datei
        loop: true,
        onLoad: () => {
          // Passe die Größe der Zeichenfläche an das Canvas-Element an
          riveAnimation.resizeDrawingSurfaceToCanvas();
        }
      });
    
      // Intersection Observer, um zu prüfen, ob das Element sichtbar ist
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Starte die Animation, wenn das Element im Viewport ist
            riveAnimation.play();
          } else {
            // Pausiere die Animation, wenn das Element nicht mehr im Viewport ist
            riveAnimation.pause();
          }
        });
      }, {
        threshold: 0.1 // Trigger, wenn 50% des Elements sichtbar sind
      });

      // Starte den Beobachtungsvorgang für das Element, das die Animation enthält
      const riveElement = document.getElementById('canvas');
      observer.observe(riveElement);
    
      // Stelle sicher, dass die Zeichenfläche bei Größenänderungen des Fensters angepasst wird
      window.addEventListener('resize', () => {
        riveAnimation.resizeDrawingSurfaceToCanvas();
      });
    });