{/* Card Grid View */}
{viewMode === 'cards' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {filteredVocabulary.map(item => <div key={item.id} className="group relative">
        <Card className="h-48 cursor-pointer transition-all duration-200 hover:shadow-md border-2 hover:border-primary/20">
          <CardContent className="p-4 h-full flex flex-col justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-primary">{item.word}</h3>
                <div className="flex items-center gap-1">
                  <AudioButton 
                    text={item.word} 
                    itemId={item.id} 
                    type="word" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-primary/10" 
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleDefinition(item.id)} 
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    {showDefinition[item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {showDefinition[item.id] && <div className="space-y-2 text-sm">
                  {item.definition && <p className="text-muted-foreground leading-relaxed">
                      {item.definition}
                    </p>}
                  {item.example && <div className="text-xs italic text-muted-foreground border-l-2 border-muted pl-2">
                      <div className="flex items-start gap-2">
                        <span className="flex-1">"{item.example}"</span>
                        <AudioButton 
                          text={item.example} 
                          itemId={item.id} 
                          type="example" 
                          size="sm" 
                          className="h-4 w-4 p-0 mt-0.5 flex-shrink-0 hover:bg-primary/10" 
                        />
                      </div>
                    </div>}
                </div>}
              
              {!showDefinition[item.id] && <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">Click eye to reveal</p>
                </div>}
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <Badge variant="secondary" className="text-xs">
                {item.language}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteVocabularyItem(item.id)} 
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Delete confirmation overlay for cards */}
        {showDeleteConfirm === item.id && <div className="absolute inset-0 bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <p className="text-sm font-medium text-red-900 mb-2">Delete this word?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => handleDeleteVocabularyItem(item.id)}>
                  Delete
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>}
      </div>)}
  </div>}

{/* Study Mode */}
{viewMode === 'study' && <div className="space-y-4">
    {/* Study Mode Controls */}
    <div className="flex justify-between items-center bg-muted/30 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Study Mode</span>
        <Badge variant="outline" className="text-xs">
          {currentCardIndex + 1} of {filteredVocabulary.length}
        </Badge>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => shuffleCards()} className="h-7 px-2" title="Random card">
          <Shuffle className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentCardIndex(0)} className="h-7 px-2" title="Reset to first">
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
    </div>

    {/* Study Card */}
    <div className="relative">
      <Card className="min-h-[300px] border-2 border-primary/20">
        <CardContent className="p-4 sm:p-8 h-full flex flex-col justify-center text-center">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                {filteredVocabulary[currentCardIndex]?.word}
              </h2>
              <AudioButton 
                text={filteredVocabulary[currentCardIndex]?.word} 
                itemId={filteredVocabulary[currentCardIndex]?.id} 
                type="word" 
                size="lg" 
                className="h-8 w-8 p-0 hover:bg-primary/10" 
              />
            </div>
            
            <Button variant="outline" onClick={() => toggleDefinition(filteredVocabulary[currentCardIndex]?.id)} className="mx-auto">
              {showDefinition[filteredVocabulary[currentCardIndex]?.id] ? <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Definition
                </> : <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Definition
                </>}
            </Button>

            {showDefinition[filteredVocabulary[currentCardIndex]?.id] && <div className="space-y-4 animate-in fade-in-50 duration-200">
                {filteredVocabulary[currentCardIndex]?.definition && <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {filteredVocabulary[currentCardIndex].definition}
                  </p>}
                {filteredVocabulary[currentCardIndex]?.example && <div className="bg-muted/50 rounded-lg p-4 max-w-xl mx-auto">
                    <div className="flex items-center gap-3 justify-center">
                      <p className="text-sm italic text-muted-foreground flex-1">
                        "{filteredVocabulary[currentCardIndex].example}"
                      </p>
                      <AudioButton 
                        text={filteredVocabulary[currentCardIndex].example} 
                        itemId={filteredVocabulary[currentCardIndex].id} 
                        type="example" 
                        size="sm" 
                        className="h-6 w-6 p-0 hover:bg-primary/10" 
                      />
                    </div>
                  </div>}
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Arrows */}
      <Button variant="ghost" size="sm" onClick={() => navigateCard('prev')} className="absolute left-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white shadow-md hover:bg-gray-50" disabled={filteredVocabulary.length <= 1}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => navigateCard('next')} className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-white shadow-md hover:bg-gray-50" disabled={filteredVocabulary.length <= 1}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>

    {/* Study Progress */}
    <div className="flex justify-center">
      <div className="flex gap-1">
        {filteredVocabulary.map((_, index) => <button key={index} onClick={() => setCurrentCardIndex(index)} className={`w-2 h-2 rounded-full transition-colors ${index === currentCardIndex ? 'bg-primary' : 'bg-muted'}`} />)}
      </div>
    </div>
  </div>}