// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const loadingContainer = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const progressBar = document.getElementById('progress');
    const bookArea = document.getElementById('book-area');
    const bookContainer = document.getElementById('book');
    const fileTitle = document.getElementById('file-title');
    
    // Controls
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');
    
    let pageFlip = null;

    // Check for target file from Spring/Thymeleaf or URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const fileName = window.targetFileName || urlParams.get('file');
    const pdfUrl = window.targetPdfUrl || (fileName ? `./${fileName}` : null);

    if (pdfUrl) {
        fileTitle.textContent = fileName || 'Document Viewer';
        loadPDF(pdfUrl, fileName || 'Document');
    } else {
        loadingText.textContent = "표시할 문서가 지정되지 않았습니다.";
        loadingText.classList.add('text-red-400');
        progressBar.parentElement.style.display = 'none';
    }

    async function loadPDF(source, name) {
        // Reset everything
        if (pageFlip) {
            pageFlip.destroy();
            pageFlip = null;
        }
        bookContainer.innerHTML = '';
        bookArea.style.display = 'none';
        loadingContainer.style.display = 'flex';
        progressBar.style.width = '0%';
        loadingText.textContent = "문서를 불러오는 중...";

        try {
            const loadingTask = pdfjsLib.getDocument(source);
            const pdf = await loadingTask.promise;
            const totalPages = pdf.numPages;
            
            loadingText.textContent = `총 ${totalPages}페이지를 렌더링하고 있습니다...`;
            
            // Render first page to determine dimensions
            const page1 = await pdf.getPage(1);
            const viewport1 = page1.getViewport({ scale: 1.5 });
            
            const bookWidth = viewport1.width;
            const bookHeight = viewport1.height;
            
            const htmlPages = [];
            
            // Add Hard Covers
            // Front cover
            let coverFrontHTML = `
                <div class="page hard" data-density="hard">
                    <div class="page-content" style="background:#1A365D; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; padding: 3rem; text-align:center; border: 4px solid #63B3ED;">
                        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#63B3ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </div>
                        <h2 style="font-family:'Outfit'; font-size:1.75rem; font-weight: 800; line-height: 1.2; margin-bottom:1.5rem; color: #FFFFFF; word-break: keep-all;">${name.replace('.pdf', '')}</h2>
                        <div style="height: 2px; width: 40px; background: #63B3ED; margin-bottom: 1.5rem;"></div>
                        <p style="opacity:0.6; font-size: 0.875rem; letter-spacing: 0.1em; text-transform: uppercase;">(주)비에이텍 기술문서</p>
                    </div>
                </div>
                <div class="page hard" data-density="hard">
                    <div class="page-content" style="background-color:#f8fafc;"></div>
                </div>
            `;
            htmlPages.push(coverFrontHTML);

            for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                
                htmlPages.push(`
                    <div class="page">
                        <div class="page-content" style="background-image: url('${imgData}');"></div>
                    </div>
                `);

                const progressPercentage = (pageNum / totalPages) * 100;
                progressBar.style.width = `${progressPercentage}%`;
            }
            
            if (totalPages % 2 !== 0) {
                 htmlPages.push(`
                    <div class="page">
                        <div class="page-content" style="background-color:#ffffff;"></div>
                    </div>
                `);
            }
            
            // Back cover
            let coverBackHTML = `
                <div class="page hard" data-density="hard">
                    <div class="page-content" style="background-color:#f8fafc;"></div>
                </div>
                <div class="page hard" data-density="hard">
                    <div class="page-content" style="background:#1A365D; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; border: 4px solid #63B3ED;">
                         <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#63B3ED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        <h2 style="font-family:'Outfit'; opacity:0.8; font-size: 1.25rem;">END OF DOCUMENT</h2>
                        <p style="opacity:0.4; font-size: 0.75rem; margin-top: 1rem;">B-Atec Co., Ltd.</p>
                    </div>
                </div>
            `;
            htmlPages.push(coverBackHTML);

            bookContainer.innerHTML = htmlPages.join('');
            loadingContainer.style.display = 'none';
            bookArea.classList.remove('hidden');
            bookArea.style.display = 'flex';
            
            let finalWidth = Math.min(bookWidth, 450); 
            let finalHeight = Math.round((finalWidth / bookWidth) * bookHeight);
            
            pageFlip = new St.PageFlip(bookContainer, {
                width: Math.round(finalWidth),
                height: Math.round(finalHeight),
                size: "stretch",
                minWidth: 300,
                maxWidth: 1600,
                minHeight: 400,
                maxHeight: 2000,
                maxShadowOpacity: 0.5,
                showCover: true,
                mobileScrollSupport: false,
                usePortrait: window.innerWidth < 800
            });
            
            pageFlip.loadFromHTML(bookContainer.querySelectorAll('.page'));

            pageFlip.on('flip', (e) => {
                updatePageInfo(e.data, totalPages);
            });
            
            prevBtn.onclick = () => pageFlip.flipPrev();
            nextBtn.onclick = () => pageFlip.flipNext();
            
            updatePageInfo(0, totalPages);

        } catch (error) {
            console.error(error);
            loadingText.textContent = "문서를 불러오는 중 오류가 발생했습니다.";
            loadingText.classList.add('text-red-400');
        }
    }
    
    function updatePageInfo(currentPageIndex, totalPdfPages) {
        let displayStr = "";
        if (currentPageIndex === 0) {
            displayStr = "표지";
        } else if (currentPageIndex >= 2 && currentPageIndex < 2 + totalPdfPages) {
            displayStr = `${currentPageIndex - 1} / ${totalPdfPages} 페이지`;
        } else {
            displayStr = "문서 끝";
        }
        pageInfo.textContent = displayStr;
    }
});

