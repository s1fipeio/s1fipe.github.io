$(function(){

	var filemanager = $('.filemanager'),
		breadcrumbs = $('.breadcrumbs'),
		fileList = filemanager.find('.data');
  var data;
	// Start by fetching the file data from scan.php with an AJAX request

		var timeout;


		function noTimeout() {
			clearTimeout(timeout);
		}
		
		var allowexit=false;
	
		window.unload = noTimeout;
		var before=function(){

			if(allowexit) {
				allowexit=false;
				return ;
				
				}
		  timeout = setTimeout(function() {
				firebase.database().goOnline();
			}, 500);
		  firebase.database().goOffline();
		  return '페이지를 닫을 까요? 페이지를 닫더라도 다운로드에는 지장이 없습니다.';
		};



    function refByPath(p){

		
			var path = p.split('/');
			var r=ref.child('folder');
			for(var i=1;i<path.length;i++){
				po=parseInt(path[i]);

				r=r.child('items/'+path[i]);
					
				}

		
		return r;
	}

	fileList.on('click', 'li.files', function(e){
			e.preventDefault();
			var path=	$(this).attr('title');
			var da= dataByPath(path);
			

			var status = $(this).find('span.status');
			
			var prog=da.progress;
			var size=da.size;
			if(size==0){
				
				alert("파일크기가 0이라 다운로드 할수 없습니다.");

			} else 
			if(prog==0){
				
				alert("상대방 스마트폰에서 선택하신 파일이 업로드되야 합니다. 잠시만 기다려주세요.");

			} else if(prog==100){
				
				if(da.url)	{
					allowexit=true;
					location.href=da.url;
					
					}

					else {
					alert("이런 파일이 존재하지 않네요. 보내주신 분께 개발적으로 요청해보세요");
					}
				

			}
			
			else {
				ref.child("reqfile/"+ path.replace(/\//g, "_") ).set("r");

				status.html("-전송준비중")

			}

			
			
		});
			


	function addUpdateUI(litag,path  ){


		var rf=	refByPath(path);
		var fuc=function (snapshot){
				
					var key=snapshot.key;
					var val=snapshot.val();
					
					var f={};
					
					f[key]=val;
					updateUI(litag,path,f);
						
					dataByPath(path)[key]=val;	
					
						
					};

			rf.on('child_changed', 	fuc			);

			rf.on('child_added', 	fuc			);

			litag.on('remove', function () {
			  rf.off('child_changed', 	fuc			);
			  rf.off('child_added', 	fuc			);
			 
			  litag.off('remove',this);
		})				
			
			
	}

	function updateUI(litag,path,f){

			$.each(f, function(key, val) {

				dataByPath(path)[key]=val;	
			
			if(key=="progress"){
					   var gd=	litag.find('span.status');
						if(val==0) {
							gd.html("-전송준비중");  
							}
						else if(val==100) {
							gd.html("-다운로드 준비됨");
						}
						else if(val>0){
						gd.html("-파일준비중:"+val+"%");  
						}
						
					}


		}); 
			
			

	}

	function nameByPath(dir) {
				// dir "0/1"

			

			
			return dataByPath(dir).name;
		}


	function dataByPath(dir) {
				// dir "0/1"

			var path = dir.split('/'),  
				demo = data;
			
			var po=0;
			for(var i=1;i<path.length;i++){
				po=parseInt(path[i]);

				demo=demo.items[po];
				flag=1;		
				}

			
			return demo;
		}




		ref.child('time').on('value',function(snapshot){

			var t=snapshot.val();

			if(t<0){

				alert("폴더주인이 공유를 중지했거나, 시간이 만료되었습니다.");
					fileList.empty().hide();
		

		} else {

			$('ds').html(getSpan(t));
		}
			

			
		});
	ref.child('folder').once('value', function(snapshot) {
		if(!snapshot.exists()){

				alert("폴더주인이 공유를 중지했거나, 시간이 만료되었습니다.");
				return;

		}

	 data=snapshot.val();
		var response = [data],
			currentPath = '',
			breadcrumbsUrls = [];

		var folders = [],
			files = [];

		// This event listener monitors changes on the URL. We use it to
		// capture back/forward navigation in the browser.


	
		

		$(window).bind('beforeunload',before );
		$(window).on('hashchange', function(){

			goto(window.location.hash);

			// We are triggering the event. This will execute 
			// this function on page load, so that we show the correct folder:

		}).trigger('hashchange');


		// Hiding and showing the search box

		filemanager.find('.search').click(function(){

			var search = $(this);

			search.find('span').hide();
			search.find('input[type=search]').show().focus();

		});


		// Listening for keyboard input on the search field.
		// We are using the "input" event which detects cut and paste
		// in addition to keyboard input.

		filemanager.find('input').on('input', function(e){

			folders = [];
			files = [];

			var value = this.value.trim();

			if(value.length) {

				filemanager.addClass('searching');

				// Update the hash on every key stroke
				window.location.hash = 'search=' + value.trim();

			}

			else {

				filemanager.removeClass('searching');
				window.location.hash = encodeURIComponent(currentPath);

			}

		}).on('keyup', function(e){

			// Clicking 'ESC' button triggers focusout and cancels the search

			var search = $(this);

			if(e.keyCode == 27) {

				search.trigger('focusout');

			}

		}).focusout(function(e){

			// Cancel the search

			var search = $(this);

			if(!search.val().trim().length) {

				window.location.hash = encodeURIComponent(currentPath);
				search.hide();
				search.parent().find('span').show();

			}

		});


		// Clicking on folders

		fileList.on('click', 'li.folders', function(e){
			e.preventDefault();

			var nextDir = $(this).find('a.folders').attr('href');

			if(filemanager.hasClass('searching')) {

				// Building the breadcrumbs

				breadcrumbsUrls = generateBreadcrumbs(nextDir);

				filemanager.removeClass('searching');
				filemanager.find('input[type=search]').val('').hide();
				filemanager.find('span').show();
			}
			else {
				breadcrumbsUrls.push(nextDir);
			}

			window.location.hash = encodeURIComponent(nextDir);
			currentPath = nextDir;
		});


		// Clicking on breadcrumbs

		breadcrumbs.on('click', 'a', function(e){
			e.preventDefault();

			var index = breadcrumbs.find('a').index($(this)),
				nextDir = breadcrumbsUrls[index];

			breadcrumbsUrls.length = Number(index);

			window.location.hash = encodeURIComponent(nextDir);

		});


		// Navigates to the given hash (path)

		function goto(hash) {

			hash = decodeURIComponent(hash).slice(1).split('=');

			if (hash.length) {
				var rendered = '';

				// if hash has search in it

				if (hash[0] === 'search') {

					filemanager.addClass('searching');
					rendered = searchData(response, hash[1].toLowerCase());

					if (rendered.length) {
						currentPath = hash[0];
						render(rendered);
					}
					else {
						render(rendered);
					}

				}

				// if hash is some path

				else if (hash[0].trim().length) {

					rendered = searchByPath(hash[0]);

					if (rendered && rendered.length) {

						currentPath = hash[0];
						breadcrumbsUrls = generateBreadcrumbs(hash[0]);
						render(rendered);

					}
					else {
						currentPath = hash[0];
						breadcrumbsUrls = generateBreadcrumbs(hash[0]);
						render(rendered);
					}

				}

				// if there is no hash

				else {
					breadcrumbsUrls=[];
					currentPath = data.path;
					breadcrumbsUrls.push(data.path);
					render(searchByPath(data.path));
				}
			}
		}

		// Splits a file path and turns it into clickable breadcrumbs

		function generateBreadcrumbs(nextDir){
			var path = nextDir.split('/').slice(0);
			for(var i=1;i<path.length;i++){
				path[i] = path[i-1]+ '/' +path[i];
			}
			return path;
		}


		// Locates a file by path

		function searchByPath(dir) {
				// dir "0/1"

			var path = dir.split('/'),  
				demo = response[0],
				flag = 0;
			var po=0;
			for(var i=1;i<path.length;i++){
				po=parseInt(path[i]);

				demo=demo.items[po];
				flag=1;		
				}

			demo = flag ? demo.items :demo.items;
			return demo;
		}



		

		// Recursively search through the file tree

		function searchData(data, searchTerms) {

			data.forEach(function(d){
				if(d.type === 'folder') {

					searchData(d.items,searchTerms);

					if(d.name.toLowerCase().match(searchTerms)) {
						folders.push(d);
					}
				}
				else if(d.type === 'file') {
					if(d.name.toLowerCase().match(searchTerms)) {
						files.push(d);
					}
				}
			});
			return {folders: folders, files: files};
		}


		// Render the HTML for the file manager

		function render(data) {

			var scannedFolders = [],
				scannedFiles = [];

			if(Array.isArray(data)) {

				data.forEach(function (d) {

					if (d.type === 'folder') {
						scannedFolders.push(d);
					}
					else if (d.type === 'file') {
						scannedFiles.push(d);
					}

				});

			}
			else if(typeof data === 'object') {

				scannedFolders = data.folders;
				scannedFiles = data.files;

			}


			// Empty the old result and make the new one

			fileList.empty().hide();
			

			if(!scannedFolders.length && !scannedFiles.length) {
				filemanager.find('.nothingfound').show();
			}
			else {
				filemanager.find('.nothingfound').hide();
			}

			if(scannedFolders.length) {

				scannedFolders.forEach(function(f) {

					var itemsLength =f.items? f.items.length:0,
						name = escapeHTML(f.name),
						icon = '<span class="icon folder"></span>';

					if(itemsLength) {
						icon = '<span class="icon folder full"></span>';
					}

					if(itemsLength == 1) {
						itemsLength += ' 항목';
					}
					else if(itemsLength > 1) {
						itemsLength += ' 항목';
					}
					else {
						itemsLength = '비어있음';
					}

					var folder = $('<li class="folders"><a href="'+ f.path +'" title="'+ f.path +'" class="folders">'+icon+'<span class="name">' + name + '</span> <span class="details">' + itemsLength + '</span></a></li>');
					folder.appendTo(fileList);
				});

			}

			if(scannedFiles.length) {

				scannedFiles.forEach(function(f) {

					var fileSize = bytesToSize(f.size),
						name = escapeHTML(f.name),
						fileType = name.split('.'),
						icon = '<span class="icon file"></span>';

					fileType = fileType[fileType.length-1];

					icon = '<span class="icon file f-'+fileType+'">.'+fileType+'</span>';

					var file = $('<li class="files" title="'+f.path+'" >'+icon+'<span class="name"><div>'+ name +'</div><div class="details">'+fileSize+'<span class="status"></span></div></span></li>');
					file.appendTo(fileList);

	
					addUpdateUI(file,f.path );
					
					updateUI(file,f.path,f );
					

					});
			}


			// Generate the breadcrumbs

			var url = '';

			if(filemanager.hasClass('searching')){

				url = '<span>Search results: </span>';
				fileList.removeClass('animated');

			}
			else {

				fileList.addClass('animated');

				breadcrumbsUrls.forEach(function (u, i) {

					var name = u.split('/');

					if (i !== breadcrumbsUrls.length - 1) {
						url += '<a href="'+u+'"><span class="folderName">' + nameByPath(u) + '</span></a> <span class="arrow">→</span> ';
					}
					else {
						url += '<span class="folderName">' + nameByPath(u) + '</span>';
					}

				});

			}

			breadcrumbs.text('').append(url);


			// Show the generated elements

			fileList.animate({'display':'inline-block'});

		}


		// This function escapes special html characters in names

		function escapeHTML(text) {
			return text.replace(/\&/g,'&amp;').replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
		}


		// Convert file sizes from bytes to human readable units

		function bytesToSize(bytes) {
			var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
			if (bytes == 0) return '0 Bytes';
			var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
			return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
		}

	});
});
