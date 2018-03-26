## Install
```bash
$ git clone git@github.com:dsdenes/telmed.git
$ cd telmed
$ yarn install
$ ./scripts/parse.js <dataDir> <cacheDir>
```
## Usage
```bash
$ ./scripts/parse.js <dataDir> <cacheDir>
$ ./scripts/search.js <cacheDir> [phoneNumbers...]
```

# Phone Mnemonic

## Problem statement

We need a service which takes in telephone numbers and tries to find
mnemonics for those numbers. The numbers will be between 3 and 12
digits. For example, if someone typed in 3473273, a matching
mnemonic would be "disease". On top of that, We'd prefer if those
mnemonics were medical terms as much as possible.
Of course, finding such mnemonics should be fast. We expect thousands of
requests per minute.

The character-digit correspondence is printed on most telephones. Here it is
for reference:

    a,b,c -> 2
    d,e,f -> 3
    g,h,i -> 4
    j,k,l -> 5
    m,n,o -> 6
    p,q,r,s -> 7
    t,u,v -> 8
    w,x,y,z -> 9

## Info for Data mining part

PubMed has a collection of close to 75K medical articles. You will
use the words in those articles as candidate mnemonics. There is a well known approach to assign
importance to words in documents. It is called the TF-IDF score:

    tf-idf(w,d) =   f(w)/W(d) * ln (|D| / (1 + c(w,D))

where

    w:           a particular word
    d:           a particular document
    tf-idf(w,d): the importance of word w in document d
    f(w):        the number of occurrences of w in d
    W(d):        the total number of words (counting both duplicates and
                 words that do not qualify as mnemonics) in d
    ln:          natural logarithm function
    |D|:         the total number of documents
    c(w,D):      the number of documents containing the word w

Basically, the `tf` part promotes frequently occurring words, while the `idf` part
demotes those words that are common in all documents.

Words that receive high tf-idf scores are likely to be more "medical" and thus more
relevant. Note that a word (e.g. aspirin) will have different tf-idf scores
in each different document it appears in. You will assign the highest of these
scores to the word. An artifact of this scoring technique is that it promotes
typos. Very rare words will have a very high idf score. Thus we want to discard
words that do not occur at least in 3 different documents (that is, c(w,D) >= 3).

The problem should be separated into a Data Mining part and to a Servicing
part. During the Data Mining part, you will build something (models, indexes,
etc ...) that will allow you to search for the numbers really fast. The Data
Mining part will be performed off-line, therefore it can take some (reasonable)
time. You need to be aware that you need to process almost a
75K articles. In the Servicing phase, you will take phone numbers and
print the corresponding mnemonics in tf-idf score order. Think of the Service
part as an actual live service, so a short warm-up time is fine.

## Solution

  * You may not use a database (such as MySQL, Mongo, Lucene, etc ...), sorry!
We do want to see how you can code and manage larger data structures

  * There must be two entry points to your system:

    1. Invoking your data miner: it will be given two arguments.
The first one is the path of the directory, where ALL files
with the .txt extension need to be processed (other entries should
be ignored). The second argument is the path to a directory, where
you can build whatever you want; we shall call this index-directory.

    2. Invoking your service: it will be given as first argument the
index-directory (see above) and an arbitrary number of phone numbers.
It should print mnemonics for each phone number in tf-idf scoring
order (with the scores also displayed)!

We do ask you to wrap these entry points in shell scripts; inside you
can perform any parameterization, etc ...

Example:

    $ ./data-mine.sh /usr/local/repo /var/tmp/index
    # any output, but please not much! there will be 75K docs in
    # /usr/local/repo

    $ ./service.sh /var/tmp/index 72846436 72840436 2774746 2774716 12003 987464 2639934448
    72846436: ratingen (0.0638998), pathogen (0.0543559)
    72840436: path0gen (0.0543559)
    2774746: aspirin (0.199684)
    2774716: aspir1n (0.199684)
    12003:
    987464: yuping (0.0053198), yuqing (0.00294109), xuping (0.00274428)
    2639934448: body-weight (0.0790547), bodyweight (0.0466669)
    # this should be really fast, of course we will use a different
    # list to test :)
    # note that for 72840436 and 2774716 you get completions only if
    # you have implemented bonus 1, and the multi-word completion
    # for 2639934448 requires bonus 2 (see below)
    # the parentheses enclose the tf-idf score of the word

You will be given the "cleaned" PubMed database in an archive consisting of
73,909 text files. These text files only contain the characters 'A'-'Z',
'a'-'z', ' ', '.', and '\n'. You can absolutely rely on this! There are no
numbers, accented or binary characters, tabs, etc ... We have done this
much preprocessing for you.

